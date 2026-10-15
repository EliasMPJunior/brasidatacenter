"""Describes entities using the ontologies this package ships."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Iterator

from importlib.resources.abc import Traversable
from rdflib import Graph, Literal, URIRef
from rdflib.namespace import RDF, RDFS, XSD, Namespace
from rdflib.util import guess_format

from brasidatacenter.resources import iter_ontology_files, ontology_root

_FACADE = Namespace("http://datacenter.app.br/ontology/tool/ontobdc/facade/ns.ttl#")
_SCHEMA = Namespace("https://schema.org/")
_DATA_ENTITY = URIRef("http://ontobdc.org/ontology/domain/ontobdc/ns.ttl#DataEntity")
_TBOX_SEGMENT = "/tool/ontobdc/"


def entity_info(entity_id: str | None = None) -> dict[str, Any] | list[dict[str, Any]] | None:
    """
    With no argument, list the entities this package declares: one item per
    subclass of ``core/ns.ttl:DataEntity`` (directly or through other
    subclasses), as ``{"entity_iri": ..., "facade": ...}``, where ``facade``
    is what ``entity_info(entity_iri)`` returns. Only subclasses of
    ``DataEntity`` are listed; a class that is not one of them (for example
    a direct subclass of ``SurfaceableEntity``) is not.

    With ``entity_id``, return the facade this package publishes for that
    entity IRI: its identifier, display name, and declared fields. Scans
    every ``tool/ontobdc/`` ontology this package ships for a
    ``facade:DataEntityFacade`` whose ``facade:isFacadeOf`` is ``entity_id``.
    Returns ``None`` when no ontology publishes one.

    Raises:
        ValueError: a matching facade is missing something a field needs.
    """
    if entity_id is None:
        return [
            {"entity_iri": entity_iri, "facade": entity_info(entity_iri)}
            for entity_iri in _data_entity_types()
        ]

    for ontology_file in _tbox_ontology_files():
        graph = Graph()
        graph.parse(str(ontology_file), format=guess_format(str(ontology_file)))
        subject = _facade_of(graph, entity_id)
        if subject is not None:
            return _read(graph, subject, entity_id)

    return None


def _data_entity_types() -> list[str]:
    """
    The subclasses of ``DataEntity``, directly or through other subclasses.

    Reading a file's text and looking for a word is about 400 times faster
    than parsing it, so a file is parsed only when it can say something
    about the classes already known: it contains ``subClassOf`` and the
    local name of one of them, starting from ``DataEntity``. Each round
    parses the new candidate files, looks for the subclasses again, and
    repeats while a subclass found names more candidates. The search needs
    no external program, so it works the same inside an installed wheel.
    """
    texts = {
        ontology_file: ontology_file.read_text(encoding="utf-8")
        for ontology_file in iter_ontology_files()
    }
    graph = Graph()
    parsed: set[Traversable] = set()
    types: set[URIRef] = set()
    while True:
        names = {_local_name(_DATA_ENTITY), *(_local_name(known) for known in types)}
        pending = [
            ontology_file
            for ontology_file, text in texts.items()
            if ontology_file not in parsed
            and "subClassOf" in text
            and any(name in text for name in names)
        ]
        if not pending:
            return sorted(str(known) for known in types)

        for ontology_file in pending:
            graph.parse(
                data=texts[ontology_file],
                format=guess_format(str(ontology_file)),
            )
            parsed.add(ontology_file)
        types = {
            known
            for known in graph.transitive_subjects(RDFS.subClassOf, _DATA_ENTITY)
            if isinstance(known, URIRef) and known != _DATA_ENTITY
        }


def _local_name(iri: URIRef) -> str:
    return str(iri).rsplit("#", 1)[-1].rsplit("/", 1)[-1]


def _tbox_ontology_files() -> Iterator[Traversable]:
    root = Path(str(ontology_root()))
    for ontology_file in iter_ontology_files():
        relative = Path(str(ontology_file)).relative_to(root).as_posix()
        if _TBOX_SEGMENT in f"/{relative}":
            yield ontology_file


def _facade_of(graph: Graph, entity_iri: str) -> URIRef | None:
    for subject in graph.subjects(RDF.type, _FACADE.DataEntityFacade):
        if (subject, _FACADE.isFacadeOf, URIRef(entity_iri)) in graph:
            return subject if isinstance(subject, URIRef) else None

    return None


def _read(graph: Graph, subject: URIRef, entity_iri: str) -> dict[str, Any]:
    fields = [
        _read_field(graph, field_subject)
        for field_subject in graph.objects(subject, _FACADE.hasFacadeField)
        if isinstance(field_subject, URIRef)
    ]
    return {
        "identifier": _required_text(graph, subject, _SCHEMA.identifier),
        "name": _label(graph, subject),
        "entity_iri": entity_iri,
        "fields": sorted(fields, key=lambda declared: declared["order"]),
    }


def _read_field(graph: Graph, subject: URIRef) -> dict[str, Any]:
    return {
        "identifier": _required_text(graph, subject, _SCHEMA.identifier),
        "datatype": _required_text(graph, subject, _FACADE.fieldDatatype),
        "order": int(_required_text(graph, subject, _FACADE.fieldOrder)),
        "required": _flag(graph, subject, _FACADE.isRequired),
        "multivalued": _flag(graph, subject, _FACADE.isMultivalued),
        "maps_to_resource": _required_text(graph, subject, _FACADE.mapsToResource),
        "labels": _labels(graph, subject),
    }


def _labels(graph: Graph, subject: URIRef) -> dict[str, str]:
    """The names the facade gives the field, by lower-case language tag."""
    return {
        str(label.language).lower(): str(label)
        for label in graph.objects(subject, _SCHEMA.name)
        if isinstance(label, Literal) and label.language
    }


def _required_text(graph: Graph, subject: URIRef, predicate: URIRef) -> str:
    value = graph.value(subject, predicate)
    if value is None or not str(value).strip():
        raise ValueError(f"The facade declares no {predicate} for {subject}.")

    return str(value).strip()


def _flag(graph: Graph, subject: URIRef, predicate: URIRef) -> bool:
    value = graph.value(subject, predicate)
    if not isinstance(value, Literal) or value.datatype != XSD.boolean:
        raise ValueError(f"The facade declares no boolean {predicate} for {subject}.")

    return bool(value.toPython())


def _label(graph: Graph, subject: URIRef) -> str:
    labels = list(graph.objects(subject, _SCHEMA.name))
    for label in labels:
        if isinstance(label, Literal) and label.language == "en":
            return str(label)

    if not labels:
        raise ValueError(f"The facade declares no name for {subject}.")

    return str(labels[0])

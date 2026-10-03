from pathlib import Path

import pytest
from rdflib import Graph
from rdflib.namespace import OWL, RDF

from brasidatacenter.resources import ONTOLOGY_BASE_IRI, iter_ontology_files, ontology_path_for_iri, ontology_root


def _relative(resource) -> str:
    return Path(str(resource)).relative_to(Path(str(ontology_root()))).as_posix()


def test_the_iri_of_an_ontology_or_of_a_term_names_its_file():
    iri = f"{ONTOLOGY_BASE_IRI}domain/aeco/representation/encoding.ttl"
    assert _relative(ontology_path_for_iri(iri)) == "domain/aeco/representation/encoding.ttl"
    assert _relative(ontology_path_for_iri(f"{iri}#IfcStepEncoding")) == "domain/aeco/representation/encoding.ttl"


def test_an_iri_without_a_file_in_the_package_is_refused():
    with pytest.raises(FileNotFoundError):
        ontology_path_for_iri(f"{ONTOLOGY_BASE_IRI}domain/aeco/ns.ttl")


def test_an_iri_outside_the_package_base_is_refused():
    with pytest.raises(ValueError):
        ontology_path_for_iri("https://w3id.org/omg#hasGeometry")


@pytest.mark.parametrize("resource", [r for r in iter_ontology_files((".ttl",)) if Path(str(r)).stat().st_size > 0], ids=_relative)
def test_every_ontology_file_declares_its_own_path_as_its_iri(resource):
    graph = Graph()
    graph.parse(str(resource), format="turtle")
    declared = {str(s) for s in graph.subjects(RDF.type, OWL.Ontology)}
    assert f"{ONTOLOGY_BASE_IRI}{_relative(resource)}" in declared

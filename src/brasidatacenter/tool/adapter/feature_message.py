"""Answers a presentation event's first message from the feature ontology."""

from __future__ import annotations

import re

from rdflib import Graph

from brasidatacenter.resources import ontology_path

_FEATURE_PATH: tuple[str, ...] = ("tool", "ontobdc", "feature")
_KNOWN_DEVICES = frozenset({"Desktop", "Mobile"})
_KNOWN_ENVIRONMENTS = frozenset({"Browser", "NativeApp"})
_VALUES_PATTERN = re.compile(
    r"VALUES\s*\(\?identifier\s+\?device\s+\?environment\s+\?language\)\s*\{.*?\}",
    re.DOTALL,
)


def first_message(
    identifier: str,
    device: str,
    environment: str,
    language: str,
) -> str | None:
    """
    Return the first message text of the conversation ``identifier``
    triggers for ``device``/``environment``, in ``language``.

    Runs ``<identifier>_first_message.rq`` from the feature ontology
    directory, substituting its single-row ``VALUES`` block with the
    arguments given. Returns ``None`` when there is no such query, or it
    matches nothing (unknown event, or no situation for this
    device/environment/language).
    """
    if device not in _KNOWN_DEVICES:
        raise ValueError(f"Unknown device: {device!r}. Expected one of {sorted(_KNOWN_DEVICES)}.")
    if environment not in _KNOWN_ENVIRONMENTS:
        raise ValueError(
            f"Unknown environment: {environment!r}. Expected one of {sorted(_KNOWN_ENVIRONMENTS)}."
        )

    query_resource = ontology_path(*_FEATURE_PATH, f"{identifier}_first_message.rq")
    if not query_resource.is_file():
        return None

    query_text = query_resource.read_text(encoding="utf-8")
    values_row = (
        "VALUES (?identifier ?device ?environment ?language) { "
        f'("{_escape_literal(identifier)}" :{device} :{environment} '
        f'"{_escape_literal(language)}") }}'
    )
    parameterized_query, replaced = _VALUES_PATTERN.subn(values_row, query_text, count=1)
    if replaced != 1:
        raise ValueError(
            f"{identifier}_first_message.rq has no single-row VALUES block to parameterize."
        )

    graph = Graph()
    for file_name in ("event.ttl", "ns.ttl"):
        resource = ontology_path(*_FEATURE_PATH, file_name)
        if resource.is_file():
            with resource.open("rb") as stream:
                graph.parse(file=stream, format="turtle")

    for row in graph.query(parameterized_query):
        if row.text is not None:
            return str(row.text)

    return None


def _escape_literal(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')

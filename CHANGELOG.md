# Changelog

## v0.10.0

### Added

- `pyproject.toml` and `LICENSE` in this repository, so it installs (`pip install -e .`, `reinstall.sh`) and builds the `brasidatacenter` package on its own.

- `resources.ontology_path_for_iri(iri)` and `ONTOLOGY_BASE_IRI`: the file of an ontology (or of a term in it) from its IRI, which is the base followed by the file's path under `ontology/`.
- Tests (`tests/`): IRI resolution, and every ontology file declaring its own path as its IRI.
- Annotation types: `domain/annotation/taxonomy/type.ttl` declares the five concrete categories an annotation is persisted as (Note, Issue, Classification, Location, Record), each a subclass of `:Annotation` with labels in English and Brazilian Portuguese.
- AECO file encodings: `aeco:FileEncoding` with `aeco:fileExtension` and `aeco:mediaType` in the core schema, and `representation/encoding.ttl` declaring the IFC STEP physical file (`ifc`, `application/x-step`) and DXF (`dxf`, `image/vnd.dxf`) encodings, registered in the catalog.

### Changed

- AECO ontology IRIs now match where each file is served: `aeco/ns.ttl` → `aeco/core/schema.ttl` (ontology and the `aeco:` namespace), `aeco/kind.ttl` → `aeco/taxonomy/kind.ttl` (ontology and the `kind:` namespace), `aeco/material.ttl` → `aeco/taxonomy/material.ttl`.

### Removed

- The `aeco/sanitary.ttl` ontology declaration in `taxonomy/kind.ttl`, which had no file.

### Fixed

- `reinstall.sh` / `reinstall.ps1` also check for `editables`, which hatchling needs for the editable install without build isolation.

## v0.6.0

### Added

- Registered the canonical FileSizeTile ontology definition for presentation surfaces.

### Removed

- Removed the obsolete production deployment workflow.
- Removed legacy distribution artifacts and redundant resource tests from the repository.

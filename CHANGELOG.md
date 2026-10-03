# Changelog

## v0.10.0

### Added

- `pyproject.toml` and `LICENSE` in this repository, so it installs (`pip install -e .`, `reinstall.sh`) and builds the `brasidatacenter` package on its own.

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

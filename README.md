# simplenexus-integration-plugin-vscode README

Provides JSON beautifying for SimpleNexus

## Installation

Download the latest version's vsix file of the extension from https://github.com/electr0sheep/simplenexus-integration-plugin-vscode/releases. From VSCode, go to the extensions tab, click the ellipses (...) and choose *Install from VSIX...*

## Features

1. Highlights required fields in red.
2. Provides go to definition and peek definition functionality (see the field in fields from the structure)
3. Provides a JSON schema that includes LOS mappings
4. Hovering over a field in the structure will show LOS mappings, and a preview of the field as defined in fields
5. cmd+option+control+b will remove unused fields, add fields that don't have a definition if a default can be found, sorts the fields in the order they occur in the structure, and formats the JSON object

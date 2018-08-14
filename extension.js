// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const deepEqual = require('deep-equal')
const fs = require('fs')

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "simplenexus-integration-plugin-vscode" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.sayHello', function () {
        // The code you place here will be executed every time your command is executed

        var jsonFields
        try {
            // var jsonFields = fs.readFileSync(atom.packages.getPackageDirPaths()[0] + '/SimpleNexus-Integrations-Plugin/simplenexus/default_json_fields.json')
            jsonFields = JSON.parse(fs.readFileSync('/Users/michaeldegraw/Desktop/SimpleNexus-Integrations-Plugin/simplenexus/default_json_fields.json').toString())
        }
        catch (err) {
            vscode.window.showErrorMessage("Unable to open default_json_fields.json")
            vscode.window.showErrorMessage(err.toString())
            return
        }

        let nmm = true
        // check for JSON extension
        if (vscode.window.activeTextEditor.document.languageId !== "json") {
            vscode.window.showErrorMessage("SimpleNexus JSON Beautifier only works on JSON files!")
            return
        }
        let selection = vscode.window.activeTextEditor.document.getText()
        try {
            var parsedJson = JSON.parse(selection)
        }
        catch (err) {
            if (String(err).startsWith("SyntaxError: Unexpected token = in JSON")) {
                vscode.window.showErrorMessage("Couldn't parse JSON")
                vscode.window.showErrorMessage("It looks like you forgot to clean up extra fields after beautifying!")
            } else {
                vscode.window.showErrorMessage("Couldn't parse JSON")
                vscode.window.showErrorMessage(String(err))
                vscode.window.showErrorMessage("Check console for more information")
                console.error(err)
            }
            return
        }
        // verify that the JSON object is SimpleNexus JSON, first by checking for unknown fields
        for (var property in parsedJson) {
            if (property != 'name' && property != 'structure' && property != 'values' && property != 'fields' && property != 'version' && property != 'initially_skip_fields') {
                vscode.window.showErrorMessage("It looks like the JSON structure you are editing doesn't match SimpleNexus' JSON.")
                vscode.window.showErrorMessage("Field \'" + property + "\' is not a supported SimpleNexus JSON field")
                vscode.window.showErrorMessage("Aborting")
                return
            }
        }
        // then verify SimpleNexus JSON by checking for existence of fields
        if (!parsedJson.hasOwnProperty('name')) {
            vscode.window.showErrorMessage("It looks like the JSON structure you are editing doesn't match SimpleNexus' JSON.")
            vscode.window.showErrorMessage("SimpleNexus JSON must have a \'name\' field")
            return
        } else if (!parsedJson.hasOwnProperty('structure')) {
            vscode.window.showErrorMessage("It looks like the JSON structure you are editing doesn't match SimpleNexus' JSON.")
            vscode.window.showErrorMessage("SimpleNexus JSON must have a \'structure\' field")
            return
        } else if (!parsedJson.hasOwnProperty('values')) {
            vscode.window.showErrorMessage("It looks like the JSON structure you are editing doesn't match SimpleNexus' JSON.")
            vscode.window.showErrorMessage("SimpleNexus JSON must have a \'values\' field")
            return
        } else if (!parsedJson.hasOwnProperty('fields')) {
            vscode.window.showErrorMessage("It looks like the JSON structure you are editing doesn't match SimpleNexus' JSON.")
            vscode.window.showErrorMessage("SimpleNexus JSON must have a \'fields\' field")
            return
        } else if (!parsedJson.hasOwnProperty('version')) {
            vscode.window.showErrorMessage("It looks like the JSON structure you are editing doesn't match SimpleNexus' JSON.")
            vscode.window.showErrorMessage("SimpleNexus JSON must have a \'version\' field")
            return
        }
        if (nmm) {
            vscode.window.showInformationMessage("🐵🍌🌰NMM Activated!🌰🍌🐵")
        }

        // I use JSON.parse(JSON.stringify(obj)) here to deep copy the objects
        var cleanedJson = { "name": JSON.parse(JSON.stringify(parsedJson.name)), "structure": JSON.parse(JSON.stringify(parsedJson.structure)), "values": JSON.parse(JSON.stringify(parsedJson.values)), "fields": [], "version": JSON.parse(JSON.stringify(parsedJson.version)) }
        var unusedFields = JSON.parse(JSON.stringify(parsedJson.fields))
        var partialDuplicateFields = []
        var cleanedFieldsIndex = 0
        var nmmAddedFields = 0

        // first, clean duplicate fields out of unusedFields until no duplicates are found

        // oddly enough, cleaning duplicates turned out to be non-trivial.

        for (var i = 0; i < unusedFields.length; i++) {
            // check entry against partialDuplicateFields first
            for (var i2 = 0; i2 < partialDuplicateFields.length; i2++) {
                if (unusedFields[i].key == partialDuplicateFields[i2].key) {
                    // make sure there isn't an exact match in partialDuplicateFields already
                    let partialDuplicateExactMatch = false
                    for (var i3 = i2; i3 < partialDuplicateFields.length; i3++) {
                        if (deepEqual(unusedFields[i], partialDuplicateFields.length[i3])) {
                            partialDuplicateExactMatch = true
                            break
                        }
                    }

                    if (partialDuplicateExactMatch === false) {
                        partialDuplicateFields.push(JSON.parse(JSON.stringify(unusedFields[i])))
                    }
                    unusedFields.splice(i, 1)
                    // we need to go back, because the field at i is now a new field
                    i--
                    continue
                }
            }

            // then check entry against other fields in unusedFields
            for (var i2 = i + 1; i2 < unusedFields.length; i2++) {
                if (unusedFields[i].key == unusedFields[i2].key) {
                    if (!deepEqual(unusedFields[i], unusedFields[i2])) {
                        partialDuplicateFields.push(JSON.parse(JSON.stringify(unusedFields[i])))
                        partialDuplicateFields.push(JSON.parse(JSON.stringify(unusedFields[i2])))
                        unusedFields.splice(i2, 1)
                    }
                    unusedFields.splice(i, 1)
                    // we need to go back, because the field at i is now a new field
                    i--
                    break
                }
            }
        }

        // Single phase
        if (parsedJson.structure[0] !== undefined && parsedJson.structure[0][0] === undefined) {
            // loop through the structure...
            for (var i = 0; i < parsedJson.structure.length; i++) {
                // and fields...
                if (parsedJson.structure[i].fields) {
                    for (var i2 = 0; i2 < parsedJson.structure[i].fields.length; i2++) {
                        var fieldExists = false
                        var duplicate = false

                        // make sure each field in structure has a matching field in fields
                        for (var i3 = 0; i3 < parsedJson.fields.length; i3++) {
                            if (parsedJson.structure[i].fields[i2] == parsedJson.fields[i3].key) {
                                fieldExists = true
                                break
                            }
                        }

                        if (fieldExists === false) {
                            // check for nmm
                            if (nmm) {
                                // add the field
                                var nmmHasField
                                for (var i3 = 0; i3 < jsonFields.fields.length; i3++) {
                                    nmmHasField = false
                                    if (jsonFields.fields[i3].key == parsedJson.structure[i].fields[i2]) {
                                        nmmHasField = true
                                        nmmAddedFields++
                                        cleanedJson.fields[cleanedFieldsIndex] = jsonFields.fields[i3]
                                        cleanedFieldsIndex++
                                        break
                                    }
                                }
                                if (nmmHasField === false) {
                                    vscode.window.showErrorMessage("NMM couldn't find \'" + parsedJson.structure[i].fields[i2] + "\' please create a new issue: https://github.com/electr0sheep/SimpleNexus-Integrations-Plugin/issues/new")
                                }
                            } else {
                                vscode.window.showWarningMessage("Field \'" + parsedJson.structure[i].fields[i2] + "\' exists in structure, but not in fields")
                            }
                        } else {
                            // look for duplicates in existing fields
                            for (var i3 = 0; i3 < cleanedJson.fields.length; i3++) {
                                if (cleanedJson.fields[i3].key == parsedJson.structure[i].fields[i2]) {
                                    duplicate = true
                                    break
                                }
                            }

                            if (duplicate === false) {
                                var index = -1
                                // find index in pre-formatted JSON structure
                                for (var i3 = 0; i3 < parsedJson.fields.length; i3++) {
                                    if (parsedJson.fields[i3].key == parsedJson.structure[i].fields[i2]) {
                                        index = i3
                                        break
                                    }
                                }

                                // match field definitions with their order in the struct ure definition
                                cleanedJson.fields[cleanedFieldsIndex] = parsedJson.fields[index]

                                // finally, remove the field from unusedFields
                                for (var i3 = 0; i3 < unusedFields.length; i3++) {
                                    if (unusedFields[i3].key == parsedJson.structure[i].fields[i2]) {
                                        unusedFields.splice(i3, 1);
                                    }
                                }
                                cleanedFieldsIndex++
                            }
                        }
                    }
                }
            }
        }
        // Multi-Phase
        else if (parsedJson.structure[0][0] !== undefined) {
            // loop through the structures...
            for (var i = 0; i < parsedJson.structure.length; i++) {
                for (var i2 = 0; i2 < parsedJson.structure[i].length; i2++) {
                    // and fields...
                    if (parsedJson.structure[i][i2].fields) {
                        for (var i3 = 0; i3 < parsedJson.structure[i][i2].fields.length; i3++) {
                            var fieldExists = false
                            var duplicate = false

                            // make sure each field in structure has a matching field in fields
                            for (var i4 = 0; i4 < parsedJson.fields.length; i4++) {
                                if (parsedJson.structure[i][i2].fields[i3] == parsedJson.fields[i4].key) {
                                    fieldExists = true
                                    break
                                }
                            }

                            if (fieldExists === false) {
                                // check for nmm
                                if (nmm) {
                                    // add the field
                                    var nmmHasField
                                    for (var i4 = 0; i4 < jsonFields.fields.length; i4++) {
                                        nmmHasField = false
                                        if (jsonFields.fields[i4].key == parsedJson.structure[i][i2].fields[i3]) {
                                            nmmHasField = true
                                            nmmAddedFields++
                                            cleanedJson.fields[cleanedFieldsIndex] = jsonFields.fields[i4]
                                            cleanedFieldsIndex++
                                            break
                                        }
                                    }
                                    if (nmmHasField === false) {
                                        vscode.window.showErrorMessage("NMM couldn't find \'" + parsedJson.structure[i][i2].fields[i3] + "\' please create a new issue: https://github.com/electr0sheep/SimpleNexus-Integrations-Plugin/issues/new")
                                    }
                                } else {
                                    vscode.window.showWarningMessage("Field \'" + parsedJson.structure[i][i2].fields[i3] + "\' exists in structure, but not in fields")
                                }
                            } else {
                                // look for duplicates in existing fields
                                for (var i4 = 0; i4 < cleanedJson.fields.length; i4++) {
                                    if (cleanedJson.fields[i4].key == parsedJson.structure[i][i2].fields[i3]) {
                                        var copyOfCleanedJson = JSON.parse(JSON.stringify(cleanedJson))
                                        duplicate = true
                                        break
                                    }
                                }

                                if (duplicate === false) {
                                    var index = -1
                                    // find index in pre-formatted JSON structure
                                    for (var i4 = 0; i4 < parsedJson.fields.length; i4++) {
                                        if (parsedJson.fields[i4].key == parsedJson.structure[i][i2].fields[i3]) {
                                            index = i4
                                            break
                                        }
                                    }

                                    // match field definitions with their order in the structure definition
                                    cleanedJson.fields[cleanedFieldsIndex] = parsedJson.fields[index]


                                    // finally, remove the field from unusedFields
                                    for (var i4 = 0; i4 < unusedFields.length; i4++) {
                                        if (unusedFields[i4].key == parsedJson.structure[i][i2].fields[i3]) {
                                            unusedFields.splice(i4, 1);
                                        }
                                    }
                                    cleanedFieldsIndex++
                                }
                            }
                        }
                    }
                }
            }
        }
        // there is no structure, just remove all the fields
        else {
            vscode.window.showErrorMessage("SimpleNexus-Integrations-Plugin doesn't support loan apps with no structure yet")
        }

        // Do SimpleNexus specific checks
        var has_errors = false

        // Check the structure
        if (cleanedJson.structure[0] !== undefined && cleanedJson.structure[0][0] === undefined) {
            for (var i = 0; i < cleanedJson.structure.length; i++) {
                let page = cleanedJson.structure[i]
                if (page.condition !== undefined) {
                    for (var i2 = 0; i2 < page.fields.length; i2++) {
                        let field = page.fields[i2]
                        if (field == page.condition) {
                            vscode.window.showErrorMessage("Page with instructions '" + page.instructions + "' has a field that is the same as the condition!")
                            has_errors = true
                        }
                    }
                }
            }
        } else if (cleanedJson.structure[0][0] !== undefined) {
            for (var i = 0; i < cleanedJson.structure.length; i++) {
                let phase = cleanedJson.structure[i]
                for (var i2 = 0; i2 < phase.length; i2++) {
                    let page = phase[i2]
                    if (page.condition !== undefined) {
                        for (var i3 = 0; i3 < page.fields.length; i3++) {
                            let field = page.fields[i3]
                            if (field == page.condition) {
                                vscode.window.showErrorMessage("Page with instructions '" + page.instructions + "' has a field that is the same as the condition!")
                                has_errors = true
                            }
                        }
                    }
                }
            }
        }

        for (var i = 0; i < cleanedJson.fields.length; i++) {
            let currentField = cleanedJson.fields[i]

            // ERRORS
            // check for type
            if (currentField.type == undefined || currentField.type == "") {
                vscode.window.showErrorMessage("Field '" + currentField.key + "' doesn't have a type!")
                has_errors = true
            }

            // single choice check
            if (currentField.type == "single_choice") {
                // check for fields with no choices
                if (currentField.choices === undefined) {
                    vscode.window.showErrorMessage("Field '" + currentField.key + "' is of single choice type but has no choices!")
                    has_errors = true
                }
            }

            // multi choice checks
            if (currentField.type == "multi_choice") {
                // check for fields with no choices
                if (currentField.choices === undefined) {
                    vscode.window.showErrorMessage("Field '" + currentField.key + "' is of multi choice type but has no choices!")
                    has_errors = true
                }
            }

            // WARNINGS
            // check for no required field
            if (currentField.required == null) {
                if (nmm === false) {
                    vscode.window.showWarningMessage("Field '" + currentField.key + "' doesn't have a required field!")
                } else {
                    currentField.required = false
                }
            }

            // check for blank fields
            for (var key in currentField) {
                if (currentField[key] === "") {
                    if (nmm === false) {
                        vscode.window.showWarningMessage("Key '" + key + "' in '" + currentField.key + "' is blank!")
                    } else {
                        delete currentField[key]
                    }
                }
            }

            // check for title and description equivalence
            if (currentField.title && currentField.description && currentField.title == currentField.description) {
                if (nmm === false) {
                    vscode.window.showWarningMessage("Field '" + currentField.key + "' has a description that is the same as it's title!")
                } else {
                    delete currentField.description
                }
            }

            // check for equal min and max
            if (currentField.min != undefined && currentField.max != undefined && currentField.min == currentField.max) {
                if (nmm === false) {
                    vscode.window.showWarningMessage("Field '" + currentField.key + "' has '" + currentField.min + "' set for both min and max!")
                } else {
                    delete currentField.min
                    delete currentField.max
                }
            }

            // check for no title on all types except info and verification of assets
            if (currentField.type != "info" && currentField.type != "verification_of_assets" && currentField.type != "info" && (currentField.title === undefined || currentField.title == "")) {
                vscode.window.showWarningMessage("Field '" + currentField.key + "' has no title!")
            }

            // state checks
            if (currentField.type == "state") {
                // property state shouldn't allow all states
                if (currentField.key == "property_state") {
                    if (currentField.allowAllStates && currentField.allowAllStates == true) {
                        vscode.window.showWarningMessage("Field '" + currentField.key + "' is subject property state, but allows all states!")
                    }
                    // all state fields except property state should allow all states
                } else {
                    if (currentField.allowAllStates === undefined || (currentField.allowAllStates && currentField.allowAllStates == false)) {
                        vscode.window.showWarningMessage("Field '" + currentField.key + "' is of state type but does not allow all states!")
                    }
                }
            }

            // single choice checks
            if (currentField.type == "single_choice") {
                // check for fields with no blank option at the start
                if (currentField.choices && currentField.choices[0] != "") {
                    if (nmm === false) {
                        vscode.window.showWarningMessage("Field '" + currentField.key + "' is of single choice type but has no blank option!")
                    } else {
                        currentField.choices.unshift("")
                    }
                }
            }

            // info checks
            if (currentField.type == "info") {
                // check for required info types
                if (currentField.required && currentField.required == true) {
                    if (nmm === false) {
                        vscode.window.showWarningMessage("Field '" + currentField.key + "' is of info type and is required!")
                    } else {
                        currentField.required = false
                    }
                }
            }

            // date checks
            if (currentField.type == "date") {
                // check for description on date
                if (currentField.description) {
                    if (nmm === false) {
                        vscode.window.showWarningMessage("Field '" + currentField.key + "' is of date type and has a description. This description won't be visible!")
                    } else {
                        delete currentField.description
                    }
                }
            }

            // phone checks
            if (currentField.type == "phone") {
                // check for min/max on phone
                if (currentField.min || currentField.max) {
                    if (nmm === false) {
                        vscode.window.showWarningMessage("Field '" + currentField.key + "' is of phone type and has either a min or max!")
                    } else {
                        delete currentField.min
                        delete currentField.max
                    }
                }
            }

        }

        if (has_errors) {
            return
        }

        if ((parsedJson.fields.length - cleanedJson.fields.length - partialDuplicateFields.length - unusedFields.length) > 0) {
            vscode.window.showInformationMessage("Removed " + (parsedJson.fields.length - cleanedJson.fields.length - partialDuplicateFields.length - unusedFields.length) + " duplicate field(s)")
        }
        if (nmmAddedFields > 0) {
            vscode.window.showInformationMessage("Added " + nmmAddedFields + " field(s)")
        }
        if (unusedFields.length > 0 && nmm == false) {
            vscode.window.showErrorMessage("Found " + unusedFields.length + " unused field(s)")
        } else if (unusedFields.length > 0 && nmm == true) {
            vscode.window.showErrorMessage("Removed " + unusedFields.length + " unused field(s)")
        }
        if (partialDuplicateFields.length > 0) {
            vscode.window.showInformationMessage("Found " + partialDuplicateFields.length + " partial duplicate(s)")
        }
        // I decided to take out the number of JSON lines that compose the unused fields...it would
        // need to be updated to include duplicate fields to be truly accurate anyway

        // if ((JSON.stringify(JSON.stringify(unusedFields, null, 2)).match(/\\n/g)||[]).length > 0) {
        //   vscode.window.showInformationMessage("Found " + (JSON.stringify(JSON.stringify(unusedFields, null, 2)).match(/\\n/g)||[]).length + " excess lines of JSON")
        // }
        vscode.window.showInformationMessage("SimpleNexus JSON Beautified!")

        // Organize "fields" fields
        var orderedJson = {}
        var unknownFields = false

        for (let field in cleanedJson) {
            if (field == "fields") {
                orderedJson[field] = []
                for (let values in cleanedJson[field]) {
                    let organizedField = {}
                    if (cleanedJson[field][values].key != undefined) {
                        organizedField.key = cleanedJson[field][values].key
                    }
                    if (cleanedJson[field][values].title != undefined) {
                        organizedField.title = cleanedJson[field][values].title
                    }
                    if (cleanedJson[field][values].description != undefined) {
                        organizedField.description = cleanedJson[field][values].description
                    }
                    if (cleanedJson[field][values].placeholder != undefined) {
                        organizedField.placeholder = cleanedJson[field][values].placeholder
                    }
                    if (cleanedJson[field][values].text != undefined) {
                        organizedField.text = cleanedJson[field][values].text
                    }
                    if (cleanedJson[field][values].min != undefined) {
                        organizedField.min = cleanedJson[field][values].min
                    }
                    if (cleanedJson[field][values].max != undefined) {
                        organizedField.max = cleanedJson[field][values].max
                    }
                    if (cleanedJson[field][values].type != undefined) {
                        organizedField.type = cleanedJson[field][values].type
                    }
                    if (cleanedJson[field][values].header_text != undefined) {
                        organizedField.header_text = cleanedJson[field][values].header_text
                    }
                    if (cleanedJson[field][values].primary_button_label != undefined) {
                        organizedField.primary_button_label = cleanedJson[field][values].primary_button_label
                    }
                    if (cleanedJson[field][values].secondary_button_label != undefined) {
                        organizedField.secondary_button_label = cleanedJson[field][values].secondary_button_label
                    }
                    if (cleanedJson[field][values].footer_text != undefined) {
                        organizedField.footer_text = cleanedJson[field][values].footer_text
                    }
                    if (cleanedJson[field][values].allowAllStates != undefined) {
                        organizedField.allowAllStates = cleanedJson[field][values].allowAllStates
                    }
                    if (cleanedJson[field][values].choices != undefined) {
                        organizedField.choices = cleanedJson[field][values].choices
                    }
                    if (cleanedJson[field][values].indentations != undefined) {
                        organizedField.indentations = cleanedJson[field][values].indentations
                    }
                    if (cleanedJson[field][values].required != undefined) {
                        organizedField.required = cleanedJson[field][values].required
                    }
                    if (Object.keys(cleanedJson[field][values]).length != Object.keys(organizedField).length) {
                        unknownFields = true
                        for (let key in cleanedJson[field][values]) {
                            if (organizedField[key] == undefined) {
                                console.log("Is " + key + " a valid entry for a " + organizedField.type + " type?")
                            }
                        }
                    }
                    orderedJson[field][values] = organizedField
                }
            } else {
                orderedJson[field] = JSON.parse(JSON.stringify(cleanedJson[field]))
            }
        }

        // only replace text if the text has changed
        // function applyEdit(vsEditor, coords, content) {
        //     var vsDocument = vscode.window.activeTextEditor.document
        //     // var vsDocument = getDocument(vsEditor);
        //     // var edit = setEditFactory(vsDocument._uri, coords, content);
        //     var edit = workspaceEditFactory()
        //     edit.set(vsDocument.uri, [textEditFactory(null, "test")])
        //     vscode.workspace.applyEdit(edit);
        // }
        // function positionFactory(line, char) {
        //     return new vscode.Position(line, char);
        // }
        // function rangeFactory(start, end) {
        //     return new vscode.Range(start, end);
        // }
        // function textEditFactory(range, content) {
        //     return new vscode.TextEdit(range, content);
        // }
        // function editFactory(coords, content) {
        //     var start = positionFactory(coords.start.line, coords.start.char);
        //     var end = positionFactory(coords.end.line, coords.end.char);
        //     var range = rangeFactory(start, end);

        //     return textEditFactory(range, content);
        // }
        // function workspaceEditFactory() {
        //     return new vscode.WorkspaceEdit();
        // }
        // function setEditFactory(uri, coords, content) {
        //     var workspaceEdit = workspaceEditFactory();
        //     var edit = editFactory(coords, content);

        //     workspaceEdit.set(uri, [edit]);
        //     return workspaceEdit;
        // }
        // function getDocument(vsEditor) {
        //     return typeof vsEditor._documentData !== 'undefined' ? vsEditor._documentData : vsEditor._document
        // }
        if (vscode.window.activeTextEditor.document.getText() !== JSON.stringify(orderedJson, null, 2) + '\n') {
            let edit = new vscode.WorkspaceEdit()
            let firstLine = vscode.window.activeTextEditor.document.lineAt(0);
            let lastLine = vscode.window.activeTextEditor.document.lineAt(vscode.window.activeTextEditor.document.lineCount - 1);
            let textRange = new vscode.Range(0,
                firstLine.range.start.character,
                vscode.window.activeTextEditor.document.lineCount - 1,
                lastLine.range.end.character);
            edit.set(vscode.window.activeTextEditor.document.uri, [new vscode.TextEdit(textRange, JSON.stringify(orderedJson, null, 2))])
            vscode.workspace.applyEdit(edit)
            // vscode.workspace.applyEdit(JSON.stringify(orderedJson, null, 2))
        }

        if (unknownFields) {
            vscode.window.showWarningMessage("Found unusual fields, check console")
        }

        // only print the last bit if something was removed
        // only print if NMM is not active
        if (!nmm) {
            if (unusedFields.length > 0) {
                editor.insertText("\n\n\n\n\n\n\n\n================================================================================\n")
                editor.insertText("|                                                                              |\n")
                editor.insertText("|                       THE FOLLOWING FIELDS WERE UNUSED                       |\n")
                editor.insertText("|                                                                              |\n")
                editor.insertText("================================================================================\n\n\n\n\n\n\n\n")
                editor.insertText(JSON.stringify(unusedFields, null, 2))
            }

            if (partialDuplicateFields.length > 0) {
                editor.insertText("\n\n\n\n\n\n\n\n================================================================================\n")
                editor.insertText("|                                                                              |\n")
                editor.insertText("|       THE FOLLOWING FIELDS HAD THE SAME KEY, BUT AREN'T TRUE DUPLICATES      |\n")
                editor.insertText("|                                                                              |\n")
                editor.insertText("================================================================================\n\n\n\n\n\n\n\n")
                editor.insertText(JSON.stringify(partialDuplicateFields, null, 2))
            }
        }






    });

    context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
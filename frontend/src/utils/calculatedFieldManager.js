/*
------------------------------------------------------------
Calculated Field Manager

Maintains metadata for all calculated fields.
------------------------------------------------------------
*/

export function createCalculatedFieldManager(initialFields = []) {

    let fields = [...initialFields];

    /*
    --------------------------------------------------------
    Generate Unique ID
    --------------------------------------------------------
    */

    function generateId(name) {

        return (
            "calc_" +
            name
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "_")
                .replace(/[^a-z0-9_]/g, "") +
            "_" +
            Date.now()
        );

    }

    /*
    --------------------------------------------------------
    Validate Field
    --------------------------------------------------------
    */

    function validate(field) {

        if (!field)
            throw new Error("Calculated field is required.");

        if (!field.name || field.name.trim() === "")
            throw new Error("Field name is required.");

        if (!field.sourceColumn)
            throw new Error("Source column is required.");

        if (!field.aggregation)
            throw new Error("Aggregation is required.");

    }

    return {

        /*
        ----------------------------------------------------
        Add
        ----------------------------------------------------
        */

        add(field) {

            validate(field);

            if (
                fields.some(
                    f =>
                        f.name.toLowerCase() ===
                        field.name.toLowerCase()
                )
            ) {

                throw new Error(
                    "Calculated field already exists."
                );

            }

            const newField = {

                id:
                    field.id ||
                    generateId(field.name),

                name:
                    field.name,

                sourceColumn:
                    field.sourceColumn,

                aggregation:
                    field.aggregation,

                isCalculated:
                    true,

                type:
                    field.type || "measure",

                createdAt:
                    new Date().toISOString(),

                updatedAt:
                    new Date().toISOString()

            };

            fields = [...fields, newField];

            return newField;

        },

        /*
        ----------------------------------------------------
        Update
        ----------------------------------------------------
        */

        update(id, updates) {

            const index = fields.findIndex(
                f => f.id === id
            );

            if (index === -1)
                return null;

            fields[index] = {

                ...fields[index],

                ...updates,

                updatedAt:
                    new Date().toISOString()

            };

            return fields[index];

        },

        /*
        ----------------------------------------------------
        Get All
        ----------------------------------------------------
        */

        getAll() {

            return [...fields];

        },

        /*
        ----------------------------------------------------
        Get Only Calculated Fields
        ----------------------------------------------------
        */

        getCalculatedFields() {

            return fields.filter(
                field => field.isCalculated
            );

        },

        /*
        ----------------------------------------------------
        Get By ID
        ----------------------------------------------------
        */

        getById(id) {

            return (

                fields.find(
                    field => field.id === id
                ) || null

            );

        },

        /*
        ----------------------------------------------------
        Get By Name
        ----------------------------------------------------
        */

        getByName(name) {

            return (

                fields.find(

                    field =>

                        field.name.toLowerCase() ===

                        name.toLowerCase()

                ) || null

            );

        },

        /*
        ----------------------------------------------------
        Exists
        ----------------------------------------------------
        */

        exists(name) {

            return fields.some(

                field =>

                    field.name.toLowerCase() ===

                    name.toLowerCase()

            );

        },

        /*
        ----------------------------------------------------
        Remove
        ----------------------------------------------------
        */

        remove(id) {

            fields = fields.filter(

                field => field.id !== id

            );

            return [...fields];

        },

        /*
        ----------------------------------------------------
        Clear
        ----------------------------------------------------
        */

        clear() {

            fields = [];

            return [];

        }

    };

}
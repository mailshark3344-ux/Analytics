import re

import sqlglot
from sqlglot import exp


# ============================================================
# SQL PARSER
# ============================================================

def parse_sql_file(data: bytes):
    """
    Parse a SQL file and extract:

        - tables
        - columns
        - primary keys
        - CREATE statements
        - INSERT statements
        - UPDATE statements
        - DELETE statements
        - ALTER TABLE changes
        - inserted_rows
        - updated_rows
        - deleted_rows
        - changed_cells
        - cells_changed

    The important addition is changed_cells.

    Example:

        {
            "table": "users",
            "row": 2,
            "primary_key": {
                "user_id": 2
            },
            "column": "status",
            "old_value": 1,
            "new_value": 0
        }
    """

    # ========================================================
    # VALIDATE INPUT
    # ========================================================

    if not isinstance(data, bytes):
        raise ValueError("SQL input must be bytes.")

    if not data:
        raise ValueError("SQL file is empty.")

    # ========================================================
    # DECODE
    # ========================================================

    try:
        sql_text = data.decode("utf-8-sig")

    except UnicodeDecodeError:

        try:
            sql_text = data.decode("utf-8")

        except UnicodeDecodeError:

            sql_text = data.decode(
                "latin1",
                errors="replace"
            )

    if not sql_text.strip():
        raise ValueError("SQL file is empty.")

    print("=" * 60)
    print("SQL PARSER")
    print("=" * 60)
    print(f"SQL file size: {len(data)} bytes")
    print(f"SQL characters: {len(sql_text)}")

    # ========================================================
    # NORMALIZE
    # ========================================================

    normalized_sql = normalize_sql_text(
        sql_text
    )

    # ========================================================
    # PARSE
    # ========================================================

    statements, dialect = parse_sql_with_fallback(
        normalized_sql
    )

    print(
        f"SQL dialect detected: {dialect}"
    )

    print(
        f"SQL statements parsed: {len(statements)}"
    )

    # ========================================================
    # RESULT
    # ========================================================

    result = {

        "dialect": dialect,

        "tables": [],

        "columns": {},

        "primary_keys": {},

        "creates": [],

        "inserts": [],

        "updates": [],

        "deletes": [],

        "added_columns": [],

        "removed_columns": [],

        # ====================================================
        # CHANGE SUMMARY
        # ====================================================

        "inserted": 0,

        "updated": 0,

        "deleted": 0,

        "cells_changed": 0,

        "inserted_rows": [],

        "updated_rows": [],

        "deleted_rows": [],

        "changed_cells": []

    }

    # ========================================================
    # PROCESS STATEMENTS
    # ========================================================

    for statement in statements:

        if statement is None:
            continue

        print(
            "Processing SQL:",
            statement.__class__.__name__
        )

        # ----------------------------------------------------
        # CREATE
        # ----------------------------------------------------

        if isinstance(
            statement,
            exp.Create
        ):

            process_create_table(
                statement,
                result
            )

        # ----------------------------------------------------
        # INSERT
        # ----------------------------------------------------

        elif isinstance(
            statement,
            exp.Insert
        ):

            insert_data = process_insert(
                statement,
                result
            )

            if insert_data:

                result["inserts"].append(
                    insert_data
                )

        # ----------------------------------------------------
        # UPDATE
        # ----------------------------------------------------

        elif isinstance(
            statement,
            exp.Update
        ):

            update_data = process_update(
                statement
            )

            if update_data:

                result["updates"].append(
                    update_data
                )

        # ----------------------------------------------------
        # DELETE
        # ----------------------------------------------------

        elif isinstance(
            statement,
            exp.Delete
        ):

            delete_data = process_delete(
                statement
            )

            if delete_data:

                result["deletes"].append(
                    delete_data
                )

        # ----------------------------------------------------
        # ALTER
        # ----------------------------------------------------

        elif isinstance(
            statement,
            exp.Alter
        ):

            process_alter_table(
                statement,
                result
            )

    # ========================================================
    # DISCOVER TABLES
    # ========================================================

    discover_tables_from_operations(
        result
    )

    # ========================================================
    # BUILD ACTUAL CELL-LEVEL CHANGES
    # ========================================================

    build_change_details(
        result
    )

    # ========================================================
    # REMOVE DUPLICATES
    # ========================================================

    result["tables"] = list(
        dict.fromkeys(
            result["tables"]
        )
    )

    result["added_columns"] = unique_dict_list(
        result["added_columns"]
    )

    result["removed_columns"] = unique_dict_list(
        result["removed_columns"]
    )

    # ========================================================
    # LOG SUMMARY
    # ========================================================

    print("-" * 60)
    print("SQL PARSER RESULT")

    print(
        "Tables:",
        result["tables"]
    )

    print(
        "Creates:",
        len(result["creates"])
    )

    print(
        "Inserts:",
        len(result["inserts"])
    )

    print(
        "Updates:",
        len(result["updates"])
    )

    print(
        "Deletes:",
        len(result["deletes"])
    )

    print(
        "Inserted rows:",
        result["inserted"]
    )

    print(
        "Updated rows:",
        result["updated"]
    )

    print(
        "Deleted rows:",
        result["deleted"]
    )

    print(
        "Changed cells:",
        result["cells_changed"]
    )

    print(
        "Changed cell details:",
        len(result["changed_cells"])
    )

    print(
        "Added columns:",
        len(result["added_columns"])
    )

    print(
        "Removed columns:",
        len(result["removed_columns"])
    )

    print("=" * 60)

    return result


# ============================================================
# NORMALIZE SQL TEXT
# ============================================================

def normalize_sql_text(sql_text: str):
    """
    Normalize common SQL dump syntax.
    """

    sql_text = sql_text.lstrip(
        "\ufeff"
    )

    sql_text = re.sub(
        r"(?im)^\s*GO\s*;?\s*$",
        "",
        sql_text
    )

    return sql_text


# ============================================================
# PARSE WITH DIALECT FALLBACK
# ============================================================

def parse_sql_with_fallback(sql_text: str):

    dialects = [
        "mysql",
        "postgres",
        "tsql",
        "sqlite"
    ]

    errors = []

    for dialect in dialects:

        try:

            statements = sqlglot.parse(
                sql_text,
                read=dialect
            )

            statements = [
                statement
                for statement in statements
                if statement is not None
            ]

            if statements:

                return statements, dialect

        except Exception as e:

            errors.append(
                f"{dialect}: {e}"
            )

    raise ValueError(
        "Unable to parse SQL file with supported "
        "dialects.\n"
        + "\n".join(errors)
    )


# ============================================================
# CREATE TABLE
# ============================================================

def process_create_table(
    statement,
    result
):

    target = statement.this

    table = None

    # --------------------------------------------------------
    # CREATE TABLE schema
    # --------------------------------------------------------

    if isinstance(
        target,
        exp.Schema
    ):

        table = target.this

    elif isinstance(
        target,
        exp.Table
    ):

        table = target

    # --------------------------------------------------------
    # FALLBACK
    # --------------------------------------------------------

    if table is None:

        table = statement.find(
            exp.Table
        )

    if table is None:
        return

    table_name = table.name

    if not table_name:
        return

    # --------------------------------------------------------
    # TABLE
    # --------------------------------------------------------

    if table_name not in result["tables"]:

        result["tables"].append(
            table_name
        )

    # --------------------------------------------------------
    # CREATE SQL
    # --------------------------------------------------------

    try:

        create_sql = statement.sql(
            dialect=result.get(
                "dialect",
                "mysql"
            )
        )

    except Exception:

        create_sql = statement.sql()

    result["creates"].append({

        "table": table_name,

        "sql": create_sql

    })

    # --------------------------------------------------------
    # SCHEMA
    # --------------------------------------------------------

    schema = None

    if isinstance(
        statement.this,
        exp.Schema
    ):

        schema = statement.this

    # --------------------------------------------------------
    # COLUMNS
    # --------------------------------------------------------

    table_columns = []

    if schema:

        for expression in schema.expressions:

            if isinstance(
                expression,
                exp.ColumnDef
            ):

                column_name = expression.name

                if (
                    column_name
                    and column_name not in table_columns
                ):

                    table_columns.append(
                        column_name
                    )

    result["columns"][
        table_name
    ] = table_columns

    # --------------------------------------------------------
    # PRIMARY KEYS
    # --------------------------------------------------------

    primary_keys = []

    if schema:

        for expression in schema.expressions:

            # ------------------------------------------------
            # Table-level primary key
            # ------------------------------------------------

            if isinstance(
                expression,
                exp.PrimaryKey
            ):

                for column in expression.expressions:

                    if isinstance(
                        column,
                        exp.Column
                    ):

                        column_name = column.name

                        if (
                            column_name
                            and column_name not in primary_keys
                        ):

                            primary_keys.append(
                                column_name
                            )

            # ------------------------------------------------
            # Column-level primary key
            # ------------------------------------------------

            elif isinstance(
                expression,
                exp.ColumnDef
            ):

                column_name = expression.name

                constraints = expression.args.get(
                    "constraints",
                    []
                )

                for constraint in constraints:

                    kind = constraint.args.get(
                        "kind"
                    )

                    if isinstance(
                        kind,
                        exp.PrimaryKeyColumnConstraint
                    ):

                        if (
                            column_name
                            and column_name not in primary_keys
                        ):

                            primary_keys.append(
                                column_name
                            )

    result["primary_keys"][
        table_name
    ] = primary_keys


# ============================================================
# INSERT
# ============================================================

def process_insert(
    statement,
    result
):

    target = statement.this

    table_name = None

    columns = []

    # --------------------------------------------------------
    # INSERT INTO table (...)
    # --------------------------------------------------------

    if isinstance(
        target,
        exp.Schema
    ):

        target_table = target.this

        if isinstance(
            target_table,
            exp.Table
        ):

            table_name = target_table.name

        for column in target.expressions:

            if isinstance(
                column,
                exp.Identifier
            ):

                columns.append(
                    column.name
                )

            elif isinstance(
                column,
                exp.Column
            ):

                columns.append(
                    column.name
                )

    # --------------------------------------------------------
    # INSERT INTO table
    # --------------------------------------------------------

    elif isinstance(
        target,
        exp.Table
    ):

        table_name = target.name

    # --------------------------------------------------------
    # FALLBACK
    # --------------------------------------------------------

    if not table_name:

        table = statement.find(
            exp.Table
        )

        if table:

            table_name = table.name

    if not table_name:
        return None

    # --------------------------------------------------------
    # REGISTER TABLE
    # --------------------------------------------------------

    if table_name not in result["tables"]:

        result["tables"].append(
            table_name
        )

    # --------------------------------------------------------
    # USE CREATE TABLE COLUMNS
    # --------------------------------------------------------

    if not columns:

        columns = list(
            result.get(
                "columns",
                {}
            ).get(
                table_name,
                []
            )
        )

    # --------------------------------------------------------
    # VALUES
    # --------------------------------------------------------

    values_expression = statement.find(
        exp.Values
    )

    rows = []

    if values_expression:

        for value_tuple in values_expression.expressions:

            row = []

            expressions = getattr(
                value_tuple,
                "expressions",
                []
            )

            for value in expressions:

                row.append(
                    sql_value_to_python(
                        value
                    )
                )

            rows.append(
                row
            )

    # --------------------------------------------------------
    # MAP VALUES
    # --------------------------------------------------------

    mapped_rows = []

    for row in rows:

        mapped_row = {}

        for index, column in enumerate(
            columns
        ):

            if index < len(row):

                mapped_row[column] = (
                    row[index]
                )

            else:

                mapped_row[column] = None

        # ----------------------------------------------------
        # Preserve extra values
        # ----------------------------------------------------

        if len(row) > len(columns):

            for index in range(
                len(columns),
                len(row)
            ):

                mapped_row[
                    f"Column_{index + 1}"
                ] = row[index]

        mapped_rows.append(
            mapped_row
        )

    # --------------------------------------------------------
    # INSERT TYPE
    # --------------------------------------------------------

    if values_expression:

        insert_type = "values"

    else:

        insert_type = "select"

    # --------------------------------------------------------
    # INSERT SELECT SQL
    # --------------------------------------------------------

    select_sql = None

    if insert_type == "select":

        expression = statement.expression

        if expression:

            try:

                select_sql = expression.sql(
                    dialect=result.get(
                        "dialect",
                        "mysql"
                    )
                )

            except Exception:

                select_sql = expression.sql()

    # --------------------------------------------------------
    # RESULT
    # --------------------------------------------------------

    return {

        "table": table_name,

        "columns": columns,

        "rows": mapped_rows,

        "row_count": len(
            mapped_rows
        ),

        "type": insert_type,

        "select": select_sql

    }


# ============================================================
# UPDATE
# ============================================================

def process_update(
    statement
):

    table = statement.this

    table_name = None

    if isinstance(
        table,
        exp.Table
    ):

        table_name = table.name

    else:

        found_table = statement.find(
            exp.Table
        )

        if found_table:

            table_name = found_table.name

    if not table_name:
        return None

    # ========================================================
    # SET VALUES
    # ========================================================

    changes = {}

    assignments = statement.args.get(
        "expressions",
        []
    )

    for assignment in assignments:

        if not isinstance(
            assignment,
            exp.EQ
        ):

            continue

        left = assignment.left

        right = assignment.right

        if not isinstance(
            left,
            exp.Column
        ):

            continue

        column_name = left.name

        if not column_name:
            continue

        changes[column_name] = (
            sql_value_to_python(
                right
            )
        )

    # ========================================================
    # WHERE
    # ========================================================

    where_clause = statement.args.get(
        "where"
    )

    where_sql = None

    if where_clause:

        try:

            where_sql = where_clause.sql()

        except Exception:

            where_sql = str(
                where_clause
            )

    # ========================================================
    # WHERE CONDITIONS
    # ========================================================

    where_conditions = extract_where_conditions(
        where_clause
    )

    # ========================================================
    # RESULT
    # ========================================================

    return {

        "table": table_name,

        "set": changes,

        "changes": changes,

        "where": where_sql,

        "where_conditions": where_conditions,

        "columns_changed": list(
            changes.keys()
        ),

        # This is the number of columns in one
        # UPDATE statement, NOT the final global count.
        "cells_changed": len(
            changes
        )

    }


# ============================================================
# DELETE
# ============================================================

def process_delete(
    statement
):

    table = statement.this

    table_name = None

    if isinstance(
        table,
        exp.Table
    ):

        table_name = table.name

    else:

        found_table = statement.find(
            exp.Table
        )

        if found_table:

            table_name = found_table.name

    if not table_name:
        return None

    # ========================================================
    # WHERE
    # ========================================================

    where_clause = statement.args.get(
        "where"
    )

    where_sql = None

    if where_clause:

        try:

            where_sql = where_clause.sql()

        except Exception:

            where_sql = str(
                where_clause
            )

    # ========================================================
    # WHERE CONDITIONS
    # ========================================================

    where_conditions = extract_where_conditions(
        where_clause
    )

    return {

        "table": table_name,

        "where": where_sql,

        "where_conditions": where_conditions

    }


# ============================================================
# ALTER TABLE
# ============================================================

def process_alter_table(
    statement,
    result
):

    table = statement.this

    table_name = None

    if isinstance(
        table,
        exp.Table
    ):

        table_name = table.name

    else:

        found_table = statement.find(
            exp.Table
        )

        if found_table:

            table_name = found_table.name

    if not table_name:
        return

    if table_name not in result["tables"]:

        result["tables"].append(
            table_name
        )

    # ========================================================
    # ACTIONS
    # ========================================================

    actions = statement.args.get(
        "actions",
        []
    )

    for action in actions:

        # ----------------------------------------------------
        # ADD COLUMN
        # ----------------------------------------------------

        column_defs = list(
            action.find_all(
                exp.ColumnDef
            )
        )

        for column_def in column_defs:

            column_name = column_def.name

            if not column_name:
                continue

            try:

                definition = column_def.sql(
                    dialect=result.get(
                        "dialect",
                        "mysql"
                    )
                )

            except Exception:

                definition = column_def.sql()

            result["added_columns"].append({

                "table": table_name,

                "column": column_name,

                "definition": definition

            })

        # ----------------------------------------------------
        # DROP COLUMN
        # ----------------------------------------------------

        for column in action.find_all(
            exp.Column
        ):

            column_name = column.name

            if not column_name:
                continue

            result["removed_columns"].append({

                "table": table_name,

                "column": column_name

            })


# ============================================================
# DISCOVER TABLES
# ============================================================

def discover_tables_from_operations(
    result
):

    for insert in result.get(
        "inserts",
        []
    ):

        table = insert.get(
            "table"
        )

        if (
            table
            and table not in result["tables"]
        ):

            result["tables"].append(
                table
            )

    for update in result.get(
        "updates",
        []
    ):

        table = update.get(
            "table"
        )

        if (
            table
            and table not in result["tables"]
        ):

            result["tables"].append(
                table
            )

    for delete in result.get(
        "deletes",
        []
    ):

        table = delete.get(
            "table"
        )

        if (
            table
            and table not in result["tables"]
        ):

            result["tables"].append(
                table
            )

    for change in result.get(
        "added_columns",
        []
    ):

        table = change.get(
            "table"
        )

        if (
            table
            and table not in result["tables"]
        ):

            result["tables"].append(
                table
            )

    for change in result.get(
        "removed_columns",
        []
    ):

        table = change.get(
            "table"
        )

        if (
            table
            and table not in result["tables"]
        ):

            result["tables"].append(
                table
            )


# ============================================================
# EXTRACT WHERE CONDITIONS
# ============================================================

def extract_where_conditions(
    where_clause
):
    """
    Extract simple WHERE equality conditions.

    Supports:

        WHERE user_id = 2

        WHERE user_id = 2 AND status = 1

    Returns:

        {
            "user_id": 2
        }
    """

    conditions = {}

    if not where_clause:
        return conditions

    # --------------------------------------------------------
    # Find all equality expressions
    # --------------------------------------------------------

    for equality in where_clause.find_all(
        exp.EQ
    ):

        left = equality.left
        right = equality.right

        if not isinstance(
            left,
            exp.Column
        ):

            continue

        column_name = left.name

        if not column_name:
            continue

        conditions[
            column_name
        ] = sql_value_to_python(
            right
        )

    return conditions


# ============================================================
# BUILD CHANGE DETAILS
# ============================================================

def build_change_details(
    result
):
    """
    Build the actual row and cell changes.

    This is the important part missing from the
    previous parser.

    The parser first reconstructs the data from INSERT
    statements, then applies UPDATE and DELETE operations
    sequentially.

    This allows us to produce:

        changed_cells

        updated_rows

        deleted_rows

        inserted_rows

        cells_changed
    """

    # ========================================================
    # RESET
    # ========================================================

    result["inserted_rows"] = []

    result["updated_rows"] = []

    result["deleted_rows"] = []

    result["changed_cells"] = []

    # ========================================================
    # IN-MEMORY DATABASE STATE
    # ========================================================

    database = {}

    # ========================================================
    # INSERTS
    # ========================================================

    for insert in result.get(
        "inserts",
        []
    ):

        table_name = insert.get(
            "table"
        )

        if not table_name:
            continue

        if table_name not in database:

            database[
                table_name
            ] = []

        rows = insert.get(
            "rows",
            []
        )

        for row in rows:

            row_copy = dict(
                row
            )

            database[
                table_name
            ].append(
                row_copy
            )

            # ----------------------------------------------
            # Preserve inserted rows
            # ----------------------------------------------

            result[
                "inserted_rows"
            ].append({

                "table":
                    table_name,

                **row_copy

            })

    # ========================================================
    # PROCESS UPDATES IN SQL ORDER
    # ========================================================

    for update in result.get(
        "updates",
        []
    ):

        table_name = update.get(
            "table"
        )

        if not table_name:
            continue

        rows = database.get(
            table_name,
            []
        )

        conditions = update.get(
            "where_conditions",
            {}
        )

        changes = update.get(
            "changes",
            {}
        )

        # ----------------------------------------------------
        # Find rows matching WHERE
        # ----------------------------------------------------

        matching_rows = []

        for row in rows:

            if row_matches_conditions(
                row,
                conditions
            ):

                matching_rows.append(
                    row
                )

        # ----------------------------------------------------
        # Apply UPDATE
        # ----------------------------------------------------

        for row in matching_rows:

            old_row = dict(
                row
            )

            changed_columns = []

            for column, new_value in changes.items():

                old_value = row.get(
                    column
                )

                # ------------------------------------------
                # Only count a cell if the value actually
                # changes.
                # ------------------------------------------

                if values_are_equal(
                    old_value,
                    new_value
                ):

                    continue

                changed_columns.append(
                    column
                )

                # ------------------------------------------
                # Primary key information
                # ------------------------------------------

                primary_key_data = get_primary_key_values(
                    table_name,
                    row,
                    result
                )

                # ------------------------------------------
                # Actual changed cell
                # ------------------------------------------

                result[
                    "changed_cells"
                ].append({

                    "table":
                        table_name,

                    "column":
                        column,

                    "old_value":
                        old_value,

                    "new_value":
                        new_value,

                    "row":
                        dict(row),

                    "primary_key":
                        primary_key_data

                })

                # ------------------------------------------
                # Apply new value
                # ------------------------------------------

                row[
                    column
                ] = new_value

            # ------------------------------------------------
            # UPDATED ROW
            # ------------------------------------------------

            if changed_columns:

                result[
                    "updated_rows"
                ].append({

                    "table":
                        table_name,

                    "before":
                        old_row,

                    "after":
                        dict(row),

                    "columns_changed":
                        changed_columns,

                    "primary_key":
                        get_primary_key_values(
                            table_name,
                            row,
                            result
                        )

                })

    # ========================================================
    # PROCESS DELETES IN SQL ORDER
    # ========================================================

    for delete in result.get(
        "deletes",
        []
    ):

        table_name = delete.get(
            "table"
        )

        if not table_name:
            continue

        rows = database.get(
            table_name,
            []
        )

        conditions = delete.get(
            "where_conditions",
            {}
        )

        remaining_rows = []

        for row in rows:

            if row_matches_conditions(
                row,
                conditions
            ):

                result[
                    "deleted_rows"
                ].append({

                    "table":
                        table_name,

                    "row":
                        dict(row),

                    "primary_key":
                        get_primary_key_values(
                            table_name,
                            row,
                            result
                        )

                })

            else:

                remaining_rows.append(
                    row
                )

        database[
            table_name
        ] = remaining_rows

    # ========================================================
    # COUNTS
    # ========================================================

    result["inserted"] = len(
        result["inserted_rows"]
    )

    result["updated"] = len(
        result["updated_rows"]
    )

    result["deleted"] = len(
        result["deleted_rows"]
    )

    result["cells_changed"] = len(
        result["changed_cells"]
    )

    # ========================================================
    # COMPATIBILITY
    # ========================================================

    # Some frontend/backend code may expect these names.

    result["changedCells"] = list(
        result["changed_cells"]
    )

    result["insertedRows"] = list(
        result["inserted_rows"]
    )

    result["updatedRows"] = list(
        result["updated_rows"]
    )

    result["deletedRows"] = list(
        result["deleted_rows"]
    )


# ============================================================
# MATCH ROW AGAINST WHERE
# ============================================================

def row_matches_conditions(
    row,
    conditions
):
    """
    Match a reconstructed row against simple
    WHERE equality conditions.

    Empty conditions are treated as a match.
    """

    if not conditions:
        return True

    for column, expected_value in conditions.items():

        actual_value = row.get(
            column
        )

        if not values_are_equal(
            actual_value,
            expected_value
        ):

            return False

    return True


# ============================================================
# VALUE COMPARISON
# ============================================================

def values_are_equal(
    left,
    right
):
    """
    Compare SQL/Python values safely.
    """

    if left is None and right is None:
        return True

    if left is None or right is None:
        return False

    # --------------------------------------------------------
    # Numeric comparison
    # --------------------------------------------------------

    if isinstance(
        left,
        (int, float)
    ) and isinstance(
        right,
        (int, float)
    ):

        return float(left) == float(right)

    # --------------------------------------------------------
    # String comparison
    # --------------------------------------------------------

    return str(left) == str(right)


# ============================================================
# PRIMARY KEY VALUES
# ============================================================

def get_primary_key_values(
    table_name,
    row,
    result
):
    """
    Return the primary key values for a row.
    """

    primary_keys = result.get(
        "primary_keys",
        {}
    ).get(
        table_name,
        []
    )

    values = {}

    for column in primary_keys:

        values[
            column
        ] = row.get(
            column
        )

    return values


# ============================================================
# SQL VALUE → PYTHON
# ============================================================

def sql_value_to_python(
    value
):
    """
    Convert SQL literals into Python values.

    Non-literal expressions are preserved as SQL.
    """

    if value is None:
        return None

    # ========================================================
    # NULL
    # ========================================================

    if isinstance(
        value,
        exp.Null
    ):

        return None

    # ========================================================
    # BOOLEAN
    # ========================================================

    if isinstance(
        value,
        exp.Boolean
    ):

        return bool(
            value.this
        )

    # ========================================================
    # LITERAL
    # ========================================================

    if isinstance(
        value,
        exp.Literal
    ):

        if value.is_string:

            return value.this

        text = str(
            value.this
        )

        # ----------------------------------------------------
        # Integer
        # ----------------------------------------------------

        try:

            return int(text)

        except (
            ValueError,
            TypeError
        ):

            pass

        # ----------------------------------------------------
        # Float
        # ----------------------------------------------------

        try:

            return float(text)

        except (
            ValueError,
            TypeError
        ):

            pass

        return text

    # ========================================================
    # OTHER SQL EXPRESSION
    # ========================================================

    try:

        return value.sql()

    except Exception:

        return str(
            value
        )


# ============================================================
# UNIQUE DICTIONARY LIST
# ============================================================

def unique_dict_list(
    values
):
    """
    Remove duplicate dictionaries.
    """

    result = []

    seen = set()

    for value in values:

        if not isinstance(
            value,
            dict
        ):

            continue

        key = repr(
            sorted(
                value.items()
            )
        )

        if key in seen:
            continue

        seen.add(
            key
        )

        result.append(
            value
        )

    return result
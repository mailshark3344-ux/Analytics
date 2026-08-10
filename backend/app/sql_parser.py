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

    Supports multiple SQL dialects by trying:

        1. MySQL
        2. PostgreSQL
        3. SQL Server / T-SQL
        4. SQLite

    The parser does not depend on specific table or column names.
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
    # NORMALIZE COMMON SQL SERVER DUMP SYNTAX
    # ========================================================

    normalized_sql = normalize_sql_text(sql_text)

    # ========================================================
    # PARSE
    # ========================================================

    statements, dialect = parse_sql_with_fallback(
        normalized_sql
    )

    print(f"SQL dialect detected: {dialect}")
    print(f"SQL statements parsed: {len(statements)}")

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

        "removed_columns": []
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
    # DISCOVER TABLES FROM OTHER STATEMENTS
    # ========================================================

    discover_tables_from_operations(
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
    print("Tables:", result["tables"])
    print("Creates:", len(result["creates"]))
    print("Inserts:", len(result["inserts"]))
    print("Updates:", len(result["updates"]))
    print("Deletes:", len(result["deletes"]))
    print("Added columns:", len(result["added_columns"]))
    print("Removed columns:", len(result["removed_columns"]))
    print("=" * 60)

    return result


# ============================================================
# NORMALIZE SQL TEXT
# ============================================================

def normalize_sql_text(sql_text: str):
    """
    Normalize common SQL dump syntax.

    Particularly useful for SQL Server dumps containing:

        GO

    between statements.
    """

    # --------------------------------------------------------
    # Remove UTF BOM if still present
    # --------------------------------------------------------

    sql_text = sql_text.lstrip("\ufeff")

    # --------------------------------------------------------
    # Remove SQL Server GO batch separators
    # --------------------------------------------------------

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
    """
    Try several SQL dialects.

    This prevents the parser from being locked to MySQL.
    """

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
    """
    Extract CREATE TABLE metadata.
    """

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
    # Fallback
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
    """
    Extract INSERT information.
    """

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
        # If INSERT has more values than discovered columns,
        # preserve them using generated column names.
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
    """
    Extract UPDATE information.
    """

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
    # RESULT
    # ========================================================

    return {

        "table": table_name,

        "set": changes,

        "changes": changes,

        "where": where_sql,

        "columns_changed": list(
            changes.keys()
        ),

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
    """
    Extract DELETE information.
    """

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

    return {

        "table": table_name,

        "where": where_sql

    }


# ============================================================
# ALTER TABLE
# ============================================================

def process_alter_table(
    statement,
    result
):
    """
    Extract ADD COLUMN and DROP COLUMN.
    """

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
# DISCOVER TABLES FROM OPERATIONS
# ============================================================

def discover_tables_from_operations(
    result
):
    """
    Make sure tables referenced by INSERT,
    UPDATE and DELETE are included.
    """

    for insert in result.get(
        "inserts",
        []
    ):

        table = insert.get(
            "table"
        )

        if table and table not in result["tables"]:

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

        if table and table not in result["tables"]:

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

        if table and table not in result["tables"]:

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

        if table and table not in result["tables"]:

            result["tables"].append(
                table
            )


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

        except (ValueError, TypeError):

            pass

        # ----------------------------------------------------
        # Float
        # ----------------------------------------------------

        try:

            return float(text)

        except (ValueError, TypeError):

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
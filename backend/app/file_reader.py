import io
import pandas as pd


def read_uploaded_file(data: bytes, filename: str):
    """
    Read CSV, XLSX or XLS data and return a cleaned DataFrame.
    """

    filename_lower = filename.lower()

    # ========================================================
    # EXCEL
    # ========================================================

    if filename_lower.endswith((".xlsx", ".xls")):

        file_object = io.BytesIO(data)

        try:
            # Read without assuming the first row is the header.
            raw_df = pd.read_excel(
                file_object,
                header=None
            )

        except Exception as e:
            raise ValueError(
                f"Unable to read Excel file: {e}"
            )

        # Remove completely empty rows
        raw_df = raw_df.dropna(
            axis=0,
            how="all"
        )

        if raw_df.empty:
            raise ValueError(
                "Excel file contains no data."
            )

        # ----------------------------------------------------
        # Detect the header row
        # ----------------------------------------------------

        header_row = None

        for index, row in raw_df.iterrows():

            non_empty_values = row.dropna()

            # A real header normally contains at least
            # two populated cells.
            if len(non_empty_values) >= 2:

                header_row = index
                break

        # Fallback
        if header_row is None:
            header_row = raw_df.index[0]

        print(
            f"Detected Excel header row: {header_row}"
        )

        # ----------------------------------------------------
        # Read Excel again using detected header
        # ----------------------------------------------------

        file_object.seek(0)

        try:

            df = pd.read_excel(
                file_object,
                header=header_row
            )

        except Exception as e:

            raise ValueError(
                f"Unable to read Excel file: {e}"
            )

    # ========================================================
    # CSV
    # ========================================================

    elif filename_lower.endswith(".csv"):

        df = None

        encodings = [
            "utf-8",
            "utf-8-sig",
            "latin1",
            "cp1252"
        ]

        last_error = None

        for encoding in encodings:

            try:

                file_object = io.BytesIO(data)

                df = pd.read_csv(
                    file_object,
                    encoding=encoding,
                    low_memory=False
                )

                print(
                    f"CSV encoding detected: {encoding}"
                )

                break

            except Exception as e:

                last_error = e

        if df is None:

            raise ValueError(
                "Unable to read CSV file: "
                f"{last_error}"
            )

    else:

        raise ValueError(
            "Unsupported file format"
        )

    # ========================================================
    # REMOVE COMPLETELY EMPTY ROWS
    # ========================================================

    df = df.dropna(
        axis=0,
        how="all"
    )

    # ========================================================
    # REMOVE COMPLETELY EMPTY COLUMNS
    # ========================================================

    df = df.dropna(
        axis=1,
        how="all"
    )

    # ========================================================
    # CLEAN COLUMN NAMES
    # ========================================================

    new_columns = []
    used_names = set()

    for index, column in enumerate(df.columns):

        name = str(column).strip()

        # Handle empty or Unnamed Excel columns
        if (
            not name
            or name.lower().startswith("unnamed:")
        ):

            name = f"Column_{index + 1}"

        original_name = name
        counter = 2

        while name in used_names:

            name = (
                f"{original_name}_{counter}"
            )

            counter += 1

        used_names.add(name)

        new_columns.append(name)

    df.columns = new_columns

    # ========================================================
    # REMOVE REPEATED HEADER ROW
    # ========================================================

    if len(df) > 0:

        first_row = [
            str(value).strip()
            for value in df.iloc[0].tolist()
        ]

        column_names = [
            str(column).strip()
            for column in df.columns
        ]

        if first_row == column_names:

            df = df.iloc[1:]

    # ========================================================
    # RESET INDEX
    # ========================================================

    df = df.reset_index(
        drop=True
    )

    print(
        "Final dataset columns:",
        df.columns.tolist()
    )

    print(
        "Final dataset rows:",
        len(df)
    )

    return df
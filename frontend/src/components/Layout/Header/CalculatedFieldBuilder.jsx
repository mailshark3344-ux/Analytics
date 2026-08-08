import React, { useEffect, useState } from "react";

import {
    Box,
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography
} from "@mui/material";

import { aggregationFunctions } from "../../../utils/aggregationEngine";

function CalculatedFieldBuilder({ columns = [], onCreate }) {
    const [selectedColumn, setSelectedColumn] = useState("");
    const [selectedAggregation, setSelectedAggregation] = useState(aggregationFunctions.SUM);
    const [fieldName, setFieldName] = useState("");

    useEffect(() => {
        if (columns.length > 0 && !selectedColumn) {
            setSelectedColumn(columns[0].name || "");
        }
    }, [columns, selectedColumn]);

    const handleCreate = () => {
        if (!selectedColumn || !fieldName.trim()) {
            return;
        }

        if (onCreate) {
            onCreate({
                name: fieldName.trim(),
                sourceColumn: selectedColumn,
                aggregation: selectedAggregation
            });
        }

        setFieldName("");
    };

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
                background: "rgba(255,255,255,0.08)",
                px: 2,
                py: 1,
                borderRadius: 2,
                border: "1px solid rgba(255,255,255,0.15)"
            }}
        >
            <Typography variant="body2" sx={{ color: "#e5e7eb", fontWeight: 600 }}>
                Calculated Fields
            </Typography>

            <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel sx={{ color: "#e5e7eb" }}>Column</InputLabel>
                <Select
                    value={selectedColumn}
                    label="Column"
                    onChange={(event) => setSelectedColumn(event.target.value)}
                    sx={{ color: "#fff", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.3)" } }}
                >
                    {columns.map((column) => (
                        <MenuItem key={column.name} value={column.name}>
                            {column.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 170 }}>
                <InputLabel sx={{ color: "#e5e7eb" }}>Aggregation</InputLabel>
                <Select
                    value={selectedAggregation}
                    label="Aggregation"
                    onChange={(event) => setSelectedAggregation(event.target.value)}
                    sx={{ color: "#fff", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.3)" } }}
                >
                    {Object.values(aggregationFunctions).map((option) => (
                        <MenuItem key={option} value={option}>
                            {option}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <TextField
                size="small"
                label="New Field Name"
                value={fieldName}
                onChange={(event) => setFieldName(event.target.value)}
                sx={{
                    minWidth: 180,
                    "& .MuiInputBase-input": { color: "#fff" },
                    "& .MuiInputLabel-root": { color: "#e5e7eb" },
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.3)" }
                }}
            />

            <Button
                variant="contained"
                size="small"
                onClick={handleCreate}
                disabled={!selectedColumn || !fieldName.trim()}
                sx={{
                    backgroundColor: "#2563eb",
                    color: "#fff",
                    "&:hover": {
                        backgroundColor: "#1d4ed8"
                    }
                }}
            >
                Create
            </Button>
        </Box>
    );
}

export default CalculatedFieldBuilder;

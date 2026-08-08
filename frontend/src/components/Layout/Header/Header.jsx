import React from "react";

import {
    AppBar,
    Toolbar,
    Typography
} from "@mui/material";

import Upload from "../Upload/Upload";
import CalculatedFieldBuilder from "./CalculatedFieldBuilder";



function Header({ 
    setColumns,
    setDatasetData,
    onCalculatedFieldCreate,
    onUploadComplete,
    columns = []
}) {


    return (

        <AppBar

            position="fixed"

            sx={{

                zIndex:1201,

                backgroundColor:"#111827"

            }}

        >



            <Toolbar>



                <Typography

                    variant="h6"

                    sx={{

                        flexGrow:1,

                        fontWeight:"bold"

                    }}

                >

                    📊 Data Analytics Platform


                </Typography>





                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <CalculatedFieldBuilder
                        columns={columns}
                        onCreate={onCalculatedFieldCreate}
                    />

                    <Upload
                        setColumns={setColumns}
                        setDatasetData={setDatasetData}
                        onUploadComplete={onUploadComplete}
                    />
                </div>




            </Toolbar>



        </AppBar>

    );

}



export default Header;
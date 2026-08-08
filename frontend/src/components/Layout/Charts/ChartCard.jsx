import React from "react";

import {
    Paper,
    Typography,
    Box
} from "@mui/material";

import ChartSelector from "./ChartSelector";
import ChartRenderer from "./ChartRenderer";



function ChartCard({

    chart,
    index,
    updateChart,
    datasetData

}) {



    return (

        <Paper

            elevation={0}

            sx={{

                height: 520,

                p: 3,

                borderRadius: 4,

                background: "#ffffff",

                border: "1px solid #ECECEC",

                display: "flex",

                flexDirection: "column",

                overflow: "hidden",

                transition: "0.3s",

                "&:hover": {

                    boxShadow:
                    "0px 12px 30px rgba(0,0,0,0.08)"

                }

            }}

        >



            {/* Chart Title */}

            <Typography

                variant="h6"

                fontWeight="bold"

                sx={{

                    mb: 0.5

                }}

            >

                {chart.title}

            </Typography>




            <Typography

                variant="body2"

                color="text.secondary"

                sx={{

                    mb: 2

                }}

            >

                Customize chart type and axes

            </Typography>






            {/* Dropdown Section */}

            <Box

                sx={{

                    flexShrink:0

                }}

            >

                <ChartSelector

                    chart={chart}

                    index={index}

                    updateChart={updateChart}

                    datasetData={datasetData}

                />

            </Box>






            {/* Chart Area */}

            <Box

                sx={{

                    height:330,

                    mt:2,

                    flexShrink:0,

                    width:"100%"

                }}

            >


                <ChartRenderer

                    chart={chart}

                    data={datasetData}

                />


            </Box>



        </Paper>


    );


}



export default ChartCard;
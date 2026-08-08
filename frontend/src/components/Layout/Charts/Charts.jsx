import React from "react";

import {
    Box,
    Grid,
    Paper,
    Typography,
    Divider
} from "@mui/material";


import ChartSelector from "./ChartSelector";
import ChartRenderer from "./ChartRenderer";



function Charts({

    charts,

    setCharts,

    datasetData

}) {



    if(
        !datasetData ||
        datasetData.length===0
    ){

        return (

            <Paper

                sx={{

                    height:450,

                    display:"flex",

                    justifyContent:"center",

                    alignItems:"center",

                    borderRadius:4,

                    background:"#fff"

                }}

            >

                <Typography

                    variant="h6"

                    color="text.secondary"

                >

                    Upload a CSV dataset to generate your dashboard

                </Typography>


            </Paper>

        );

    }





    const updateChart=(index,key,value)=>{


        const updatedCharts=[...charts];


        updatedCharts[index]={

            ...updatedCharts[index],

            [key]:value

        };


        setCharts(updatedCharts);


    };






    return (

        <Box>


            <Grid

                container

                spacing={3}

                sx={{

                    alignItems:"stretch"

                }}

            >



                {

                    charts.map((chart,index)=>(



                        <Grid

                            item

                            xs={12}

                            sm={6}

                            md={4}

                            lg={4}

                            xl={3}

                            key={index}

                        >



                            <Paper

                                elevation={0}

                                sx={{

                                    height:580,

                                    borderRadius:4,

                                    border:"1px solid #E5E7EB",

                                    background:"#fff",

                                    overflow:"hidden",

                                    display:"flex",

                                    flexDirection:"column",

                                    transition:"0.3s",

                                    "&:hover":{

                                        boxShadow:
                                        "0 15px 35px rgba(0,0,0,.08)"

                                    }

                                }}

                            >





                                {/* Header */}

                                <Box

                                    sx={{

                                        p:3,

                                        height:90,

                                        background:"#FAFAFA"

                                    }}

                                >


                                    <Typography

                                        variant="h6"

                                        fontWeight="bold"

                                    >

                                        {
                                            chart.title ||
                                            `Chart ${index+1}`
                                        }


                                    </Typography>



                                    <Typography

                                        variant="body2"

                                        color="text.secondary"

                                    >

                                        Customize chart type and axes

                                    </Typography>


                                </Box>






                                <Divider />








                                {/* Dropdown area */}


                                <Box

                                    sx={{

                                        p:2,

                                        height:100

                                    }}

                                >


                                    <ChartSelector

                                        chart={chart}

                                        index={index}

                                        updateChart={updateChart}

                                        datasetData={datasetData}

                                    />


                                </Box>









                                {/* Chart area */}


                                <Box

                                    sx={{

                                        height:360,

                                        px:2,

                                        pb:2

                                    }}

                                >


                                    <ChartRenderer

                                        chart={chart}

                                        data={datasetData}

                                    />


                                </Box>





                            </Paper>



                        </Grid>



                    ))


                }



            </Grid>



        </Box>


    );

}



export default Charts;
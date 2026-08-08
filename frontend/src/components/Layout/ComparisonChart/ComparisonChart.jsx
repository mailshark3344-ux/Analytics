import React, {
    useState
} from "react";


import {

Box,

Typography,

FormControl,

InputLabel,

Select,

MenuItem,

Checkbox,

ListItemText,

Paper

} from "@mui/material";


import {

BarChart,

Bar,

XAxis,

YAxis,

Tooltip,

Legend,

CartesianGrid,

ResponsiveContainer

} from "recharts";


import {

prepareComparisonData

}

from "../../../utils/chartDataProcessor";







function ComparisonChart({

datasetData

}) {



const [category,setCategory]=useState("");



const [measures,setMeasures]=useState([]);








if(

!datasetData ||

datasetData.length===0

){

return null;

}








const columns=

Object.keys(datasetData[0]);









/*
    Detect numeric fields
*/


const numericColumns = columns.filter(column=>{


const values = datasetData

.slice(0,30)

.map(row=>row[column]);



return values.every(value=>

value!=="" &&

!isNaN(Number(value))

);


});










/*
    Detect category fields

*/


const categoryColumns = columns.filter(column=>{


const values = datasetData

.slice(0,30)

.map(row=>row[column]);



const uniqueValues=

new Set(values).size;



return (

typeof values[0]==="string"

&&

uniqueValues < datasetData.length

);


});









/*
    Use common processor

*/


const chartData =

category && measures.length>0

?

prepareComparisonData(

datasetData,

category,

measures

)

:

[];









const colors=[

"#2563EB",

"#16A34A",

"#DC2626",

"#9333EA",

"#EA580C",

"#0891B2"

];










return (

<Paper

sx={{

padding:3,

marginTop:3,

borderRadius:4

}}

>






<Typography

variant="h6"

fontWeight="bold"

sx={{

mb:3

}}

>

Compare Multiple Metrics

</Typography>









<FormControl

fullWidth

sx={{

mb:3

}}

>


<InputLabel>

Category

</InputLabel>


<Select


value={category}


label="Category"


onChange={(e)=>

setCategory(e.target.value)

}


>


{

categoryColumns.map(column=>(


<MenuItem

key={column}

value={column}

>

{column}

</MenuItem>


))


}


</Select>


</FormControl>











<FormControl

fullWidth

>


<InputLabel>

Measures

</InputLabel>


<Select


multiple


value={measures}


label="Measures"


onChange={(e)=>

setMeasures(e.target.value)

}


renderValue={(selected)=>

selected.join(", ")

}


>



{

numericColumns.map(column=>(


<MenuItem

key={column}

value={column}

>


<Checkbox

checked={

measures.includes(column)

}

/>


<ListItemText

primary={column}

/>


</MenuItem>


))


}



</Select>


</FormControl>









<Box

sx={{

height:420,

mt:4

}}

>


<ResponsiveContainer

width="100%"

height="100%"

>


<BarChart


data={chartData}


margin={{

top:20,

right:30,

left:20,

bottom:20

}}


>


<CartesianGrid

strokeDasharray="3 3"

/>





<XAxis

dataKey="name"

/>



<YAxis/>




<Tooltip

formatter={(value)=>

value.toLocaleString()

}

/>



<Legend/>







{

measures.map((measure,index)=>(



<Bar


key={measure}


dataKey={measure}


fill={

colors[index % colors.length]

}


radius={[8,8,0,0]}


/>


))


}






</BarChart>


</ResponsiveContainer>


</Box>






</Paper>

);


}



export default ComparisonChart;
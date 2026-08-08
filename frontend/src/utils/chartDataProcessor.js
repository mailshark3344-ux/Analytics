// src/utils/chartDataProcessor.js



/*
    Prepare data for charts

    Example:

    Input:

    Category | Amount | Profit

    Furniture | 5729 | 64
    Furniture | 2927 | 146


    Output:

    [
      {
        name:"Furniture",
        Amount:8656,
        Profit:210
      }
    ]

*/


export function prepareChartData(

    datasetData,

    xColumn,

    measures=[]

){



    if(

        !datasetData ||

        datasetData.length===0 ||

        !xColumn ||

        measures.length===0

    ){

        return [];

    }






    const grouped={};






    datasetData.forEach(row=>{


        const category =

        row[xColumn] || "Unknown";






        if(!grouped[category]){


            grouped[category]={

                name:category

            };


        }







        measures.forEach(measure=>{



            const value =

            Number(row[measure]) || 0;





            if(!grouped[category][measure]){


                grouped[category][measure]=0;


            }





            grouped[category][measure]+=value;




        });





    });







    return Object.values(grouped);





}









/*
    Automatic single metric chart

    Example:

    Category + Amount


    Output:

    [
      {
        name:"Furniture",
        Amount:8656
      }
    ]

*/


export function prepareSingleMeasureChart(

    datasetData,

    xColumn,

    yColumn

){


    return prepareChartData(

        datasetData,

        xColumn,

        [

            yColumn

        ]

    );


}









/*
    Multi metric comparison


    Example:

    Category

    Amount
    Profit
    Quantity



*/


export function prepareComparisonData(

    datasetData,

    categoryColumn,

    selectedMeasures

){



    return prepareChartData(

        datasetData,

        categoryColumn,

        selectedMeasures

    );


}

export function prepareTreemapData(datasetData, xColumn, yColumn) {
    if (!datasetData || datasetData.length === 0 || !xColumn || !yColumn) {
        return [];
    }

    const sampleValues = datasetData.map(row => row[yColumn]);
    const yNumeric = sampleValues.every(value => value !== "" && value !== null && !isNaN(Number(value)));

    if (yNumeric) {
        return prepareSingleMeasureChart(datasetData, xColumn, yColumn).map(item => ({
            name: item.name,
            value: Number(item[yColumn]) || 0
        }));
    }

    const xUnique = new Set(datasetData.map(row => row[xColumn])).size;
    const yUnique = new Set(datasetData.map(row => row[yColumn])).size;

    const groupColumn = xUnique > yUnique ? yColumn : xColumn;
    const grouped = {};

    datasetData.forEach(row => {
        const key = row[groupColumn] || "Unknown";
        grouped[key] = (grouped[key] || 0) + 1;
    });

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
}


/*
    Cross-tab / grouped counts for two categorical columns

    Example:

    X      | Y
    A      | red
    A      | blue
    B      | red

    Output:
    [
      { name: 'A', red: 1, blue:1 },
      { name: 'B', red: 1 }
    ]

*/
export function prepareCrossTab(datasetData, xColumn, yColumn) {
    if (!datasetData || datasetData.length === 0 || !xColumn || !yColumn) return [];

    const grouped = {};
    const yValuesSet = new Set();

    datasetData.forEach(row => {
        const xVal = row[xColumn] || "Unknown";
        const yVal = row[yColumn] || "Unknown";
        yValuesSet.add(yVal);

        if (!grouped[xVal]) grouped[xVal] = { name: xVal };

        if (!grouped[xVal][yVal]) grouped[xVal][yVal] = 0;
        grouped[xVal][yVal] += 1;
    });

    return Object.values(grouped);
}
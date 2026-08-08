// src/utils/dataAnalyzer.js


export function analyzeDataset(datasetData){


    if(!datasetData || datasetData.length===0){

        return {

            numericColumns:[],
            textColumns:[],
            dateColumns:[],
            idColumns:[]

        };

    }



    const columns =
    Object.keys(datasetData[0]);



    const numericColumns=[];
    const textColumns=[];
    const dateColumns=[];
    const idColumns=[];




    columns.forEach(column=>{


        const values =
        datasetData
        .slice(0,50)
        .map(row=>row[column])
        .filter(v=>v!=="" && v!==null);



        const uniqueCount =
        new Set(values).size;



        const firstValue =
        values[0];





        /*
            Detect ID columns

            Example:
            Order ID
            Customer ID

        */

        if(

            column.toLowerCase().includes("id")

            &&

            uniqueCount > datasetData.length * 0.5

        ){

            idColumns.push(column);

            return;

        }






        /*
            Detect numbers

        */

        const isNumber =
        values.every(value=>

            !isNaN(Number(value))

        );



        if(isNumber){

            numericColumns.push(column);

            return;

        }







        /*
            Detect dates

        */


        const isDate =
        values.every(value=>{


            const date =
            new Date(value);


            return (

                date instanceof Date

                &&

                !isNaN(date)

            );


        });



        if(isDate){

            dateColumns.push(column);

            return;

        }








        /*
            Remaining text columns

        */


        if(typeof firstValue==="string"){


            textColumns.push(column);


        }



    });






    return {


        numericColumns,

        textColumns,

        dateColumns,

        idColumns


    };


}
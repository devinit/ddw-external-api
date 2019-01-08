# DDW API

Base URL: - http://212.111.41.68:8000/

### Endpoints
- /all_tables
- /meta_data (just serves di_concept_in_dh, not too useful at the moment)
- /single_table
- /multi_table


### Parameters for /single_table
|Parameter|Description|Usage Example|
|----------|-------------------------|------------------------------|
|indicator| The table ID from which to retrieve the data | ?indicator=population_total|
|entities| Country code | ?entities=UG,KE,NA|
|start_year| Lower year limit for the returned data | ?start_year=2000|
|end_year| Upper year limit for the returned data | ?end_year=2001|
|limit| Number of rows returned | ?limit=100|
|offset| The results page to return e.g. if the limit is 10 out 30 rows, an offset of 2 will return the second 10 records | ?offset=2|
|format| The data format of the returned results | ?format=xml (available options are xml, json, or csv)|

#### Example query
<pre>
/single_table?indicator=population_total&entities=UG,KE&start_year=2000&end_year=2000&limit=2&offset=0&format=xml
</pre>

### Parameters for /multi_table
|Parameter|Description|Usage Example|
|----------|-------------------------|------------------------------|
|indicator| The table name from which to retrieve the data | ?indicators=population_total,govt_revenue_pc_gdp|
|entities| Country code | ?entities=UG,KE,NA|
|start_year| Lower year limit for the returned data | ?start_year=2000|
|end_year| Upper year limit for the returned data | ?end_year=2001|
|limit| Number of rows returned | ?limit=100|
|offset| The results page to return e.g. if the limit is 10 out 30 rows, an offset of 2 will return the second 10 records | ?offset=2|
|format| The data format of the returned results | ?format=xml (available options are xml, json, or csv)|

#### Example query
/multi_table?indicators=population_total,govt_revenue_pc_gdp&entities=UG&start_year=2015&format=xml

## Usage

### Data Hub
This section documents how to retrieve data from the API partaining to common Data Hub (DDH) visualisations

- [Global Picture](docs/global-picture.md)

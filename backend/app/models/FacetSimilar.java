package models;


import java.io.BufferedReader;
import java.io.FileReader;
import java.io.File;
import java.io.InputStreamReader;
import java.util.*;
import org.json.*;
import play.Logger;

public class FacetSimilar{

        public static List<String> getSimilarCases(String caseCite, String facets) throws Exception{
		System.out.println(caseCite);
		List<Integer> facetList = getFacetsFromString(facets);	
		List<String> result = readFileAndGetCourtIds(facetList, caseCite);
		return result;
	}

	private static List<String>readFileAndGetCourtIds(List<Integer> facetList, String caseCite) throws Exception{
	       //Find the data for the case in request. 
		String filepath = "/data/solr-5.4.1/facetData/supremeCourtData.csv";
                BufferedReader br = new BufferedReader(new FileReader(filepath));
                String line;
                while((line = br.readLine()) != null){
                        String [] data = line.split(",(?=([^\"]*\"[^\"]*\")*[^\"]*$)");
                        if(data[6].equals(caseCite)){
				List<String> valuesForCase = getDataFromLine(line, facetList);
				System.out.println("Values for case: " + valuesForCase.toString());
				//Now we look for other lines which match the values for this case for the given facetList.
				String courtId = data[53]; 
				List<String> result = lookForOtherCases(valuesForCase, courtId, facetList);
				return result;
			}
		}
	
		br.close();	
		return null;
	}
	
	private static List<String> lookForOtherCases(List<String> valuesForCase, String courtIdForGivenCase,  List<Integer> facetList) throws Exception{
		//Read CSV. Extract line. Split line on comma regex. 
		//array[every value in facet list] must match every value in valuesForCase.
		
		List<String> resultList = new ArrayList<String>();
		String filepath = "/data/solr-5.4.1/facetData/supremeCourtData.csv";
		BufferedReader br = new BufferedReader(new FileReader(filepath));
                String line;
		
	 
		while((line = br.readLine()) != null){
			String [] data = line.split(",(?=([^\"]*\"[^\"]*\")*[^\"]*$)");
		
			if(data.length > 53){
				//There is a courtId. 
				String courtId = data[53];
				boolean flag = false;
				//Get data from line into list using the method from before.
				List<String> potentialMatchList = getDataFromLine(line, facetList); 	
				for(int i=0; i < valuesForCase.size(); i++){
					String expected = valuesForCase.get(i);
					String actual = potentialMatchList.get(i);
					if(!expected.equals(actual)){
						flag = false;
						break; //Don't check further. 
					}

					flag = true;
				}

				//If we come out of the loop with flag as true, place the courtId in the result list and read another line!
				if(flag){
					//Match! Place courtId into result. 
					if(!courtId.equals(courtIdForGivenCase)){
						resultList.add(courtId);
					}
				}	
			}
		}

		br.close();
		return resultList;
	}

	private static List<String> getDataFromLine(String line, List<Integer> facetList) throws Exception{
		List<String> valuesForCase = new ArrayList<String>();
		String [] data = line.split(",(?=([^\"]*\"[^\"]*\")*[^\"]*$)");
		//Facet list has the column numbers you need to get the data out of! Extract data from data[] and put into valuesForCase.
		for(int i=0; i < facetList.size(); i++){
			int col = facetList.get(i);
			valuesForCase.add(data[col]);
		}
		
		return valuesForCase;
	}
	
	private static List<Integer> getFacetsFromString(String facets) throws Exception{
		//Iterate through comma separated string and extract integer and place into list.
		List<Integer> list = new ArrayList<Integer>();
		
		String[] array = facets.split(",");
		for(int i=0; i < array.length; i++){
			int temp = Integer.parseInt(array[i]);
			System.out.println("Facet " + i+1 +  ": " + temp);
			list.add(temp);
		}
		
		return list;
	}
}

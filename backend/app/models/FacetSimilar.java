package models;

import com.mongodb.client.*;
import com.mongodb.util.*;
import static com.mongodb.client.model.Filters.*;
import org.bson.Document;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.File;
import java.io.InputStreamReader;
import java.util.*;
import org.json.*;
import play.Logger;

public class FacetSimilar{
	
	public static Map<Integer, String> columnToKey = new HashMap<Integer, String>();
	

	public static List<String> queryMongoForSimilar(String courtId, String facets) throws Exception{
		//Query mongo for other facets with these values.
		System.out.println("Court id is: " + courtId);
		initializeMap();
		List<String> facetList = facetStringToListOfKeys(facets);
		//Facet list has the keys to get. Query mongo for the document with given courtId, then pull the values of these keys.

		MongoConnection mc = new MongoConnection("supremeCourtDataDB.properties");
   	        MongoCollection<Document> collection = mc.getCollection();
		
		int courtIdInt = Integer.parseInt(courtId);
		Document d = collection.find(eq("courtId", courtIdInt)).first();
		System.out.println("Doc with this court id: " + d);	

		Document queryDoc = new Document();	
		//Build query based on given keys and their values in this doc.
		for(int i=0; i < facetList.size(); i++){
			String key = facetList.get(i);
			String tempString;
			int tempInt;
			try{
				tempString = d.getString(key);
				//queryJSON.put(key, tempString);
				queryDoc.put(key, tempString);
			}catch(ClassCastException c){
				tempInt = d.getInteger(key);
				queryDoc.put(key, tempInt);
				//queryJSON.put(key, tempInt);
			}						
		}
		
		List<String> resultList = new ArrayList<String>();	
		
		System.out.println("Querying mongo.");
		FindIterable<Document> result = collection.find(queryDoc);
	
		for(Document doc : result){
			String temp = Integer.toString(doc.getInteger("courtId"));
			resultList.add(temp);
		}	
		
		System.out.println("Done!");	
		return resultList;
	}



	private static void initializeMap(){
		columnToKey.put(10, "term");
		columnToKey.put(12, "chief");
          	columnToKey.put(17, "petitioner");
                columnToKey.put(19, "respondent");
		columnToKey.put(41, "issueArea");
                columnToKey.put(42, "decisionDirection");
                columnToKey.put(46, "lawType");
	}

	private static List<String> facetStringToListOfKeys(String facets) throws Exception{
		
		List<String> facetList = new ArrayList<String>();
		
		String array[] = facets.split(",");
		for(int i=0; i < array.length; i++){
			int temp = Integer.parseInt(array[i]);
			String key = columnToKey.get(temp);
			if(key != null){
				facetList.add(key);
			}
		}

		return facetList;
	}



	//If moving back to CSV method for some reason, let's keep these methods here. 
	//Application.java will call queryMongoForSimilar anyways.

	
        public static List<String> getSimilarCases(String courtId, String facets) throws Exception{
		System.out.println(courtId);
		List<Integer> facetList = getFacetsFromString(facets);	
		List<String> result = readFileAndGetCourtIds(facetList, courtId);
		return result;
	}

	private static List<String>readFileAndGetCourtIds(List<Integer> facetList, String courtId) throws Exception{
	       //Find the data for the case in request. 
		String filepath = "/data/solr-5.4.1/facetData/supremeCourtData.csv";
                BufferedReader br = new BufferedReader(new FileReader(filepath));
                String line;
                while((line = br.readLine()) != null){
                        String [] data = line.split(",(?=([^\"]*\"[^\"]*\")*[^\"]*$)");
                        if(data[53].equals(courtId)){
				List<String> valuesForCase = getDataFromLine(line, facetList);
				System.out.println("Values for case: " + valuesForCase.toString());
				//Now we look for other lines which match the values for this case for the given facetList.
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

package models;

import java.net.URL;
import java.net.HttpURLConnection;
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.File;
import java.io.InputStreamReader;
import java.util.*;
import org.json.*;
import play.Logger;



public class Query{
	
	public static List<Integer> querySolr(String query) throws Exception{
		//Queries solr with the given string.
		//Returns an ArrayList of document ids, highest score in array[0], second in array[1], etc.

		List<Integer> ranked = new ArrayList<Integer>();

		String endpoint = "http://52.36.127.109:8983/solr/gettingstarted_shard1_replica2/select?q=" + query + "&fl=score%2C+courtid&rows=50&wt=json";
		URL url = new URL(endpoint);
		HttpURLConnection connection = (HttpURLConnection) url.openConnection();
		connection.setRequestMethod("GET");
		connection.setRequestProperty("Accept", "application/json");
		BufferedReader br = new BufferedReader(new InputStreamReader((connection.getInputStream())));
		StringBuilder sb = new StringBuilder();
		
		String line;
		while ((line = br.readLine()) != null) {
	        	sb.append(line);
	    	}

	    	
		//Convert the string  to JSON. 
		JSONObject outerJSON = new JSONObject(sb.toString());
		JSONObject responseJSON = outerJSON.getJSONObject("response");
		JSONArray jsonArray = responseJSON.getJSONArray("docs");

		for (int i = 0; i < jsonArray.length(); i++) {  // **line 2**
		     JSONObject childJSONObject = jsonArray.getJSONObject(i);
		    	
		     JSONArray temp = childJSONObject.getJSONArray("courtid");
		     int id = temp.optInt(0);
		     Double score = childJSONObject.getDouble("score");

		     placeInList(ranked, id);
		     
		}

		//Need to change this to return the score as well, for calculations. Or pass the score when calculated to the algorithm (w/pagerank).
		System.out.println(ranked);
		return ranked;
	}	

	
	public static String queryCourtListener(List<Integer> ids) throws Exception{
		//Ideally change this to something that makes a REST call to court listener  instead of looking locally?

		StringBuilder sb = new StringBuilder();
		sb.append("{\"documents\":[");
		Logger.debug(Integer.toString(ids.size()));
		for(int i=0; i < ids.size(); i++){	
 			String path = "/data/solr-5.4.1/scotus/";
			String id = Integer.toString(ids.get(i));
			path = path + id + ".json";
			File file = new File(path);
			if(file.exists()) {
		        	BufferedReader br = new BufferedReader(new FileReader(path));
				String line;
				while((line = br.readLine()) != null){
					sb.append(line);
				}
				if(i < ids.size() - 1) {
			  		sb.append(",");
                       	 	}
			}
		}
		sb.append("]}");
		return sb.toString();
	}

	public static String findCitations(int id) {
       	    StringBuilder sb = new StringBuilder();
            BufferedReader br;
            String path = "/data/solr-5.4.1/scotus/";
            String fileId = Integer.toString(id);
            path = path + fileId + ".json";
            try {
                br = new BufferedReader(new FileReader(path));
                String line;
                while((line = br.readLine()) != null) {
                    sb.append(line);
                }
                JSONObject outer = new JSONObject(sb.toString());
                JSONArray citations = outer.getJSONArray("opinions_cited");
                sb = new StringBuilder();
                sb.append("{\"citations\" : [");
                for(int i = 0; i < citations.length(); i++) {
                    String citedUrl = citations.getString(i);
                    String temp[] = citedUrl.split("/");
                    String citedId = temp[temp.length - 1];
                    sb.append(citedId);
                    if(i < citations.length() - 1)
                        sb.append(",");
                }
		sb.append("]}");
                return sb.toString();
            } catch(Exception e) {
                e.printStackTrace();
                return "error";
            }
        }


	private static void placeInList(List<Integer> list, int id){
		for(int i=0; i < list.size(); i++){
			if(list.get(i) == id){
				//Found, don't place.
				return;
			}
		}
	
		//Else place.
		list.add(id);
	}

}

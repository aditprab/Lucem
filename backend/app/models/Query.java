package models;

import java.net.URL;
import java.net.HttpURLConnection;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.*;
import org.json.*;


class Query{

	public static void main(String[] args) throws Exception{
		List<Integer> queryResults = querySolr("death");
	}

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

		System.out.println(ranked);
		return ranked;
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
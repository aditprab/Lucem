package models;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.File;
import java.io.InputStreamReader;
import java.util.*;
import org.json.*;


public class CaseInfo{
	

	public static String getCaseInfo(String caseCite) throws Exception{
		//Look up the case using caseCite in the CSV.
		String filepath = "/data/solr-5.4.1/facetData/supremeCourtData.csv";
		BufferedReader br = new BufferedReader(new FileReader(filepath));
		String line;
		while((line = br.readLine()) != null){
			String [] data = line.split(",(?=([^\"]*\"[^\"]*\")*[^\"]*$)");
			if(data[6].equals(caseCite)){
				//Match!
				String json = getDataFromLine(data);	
				return json;
			}
		}

		//If we get here without returning, there is no entry corresponding to this caseCite.
		return null;

	}

	private static String getDataFromLine(String[] data) throws Exception{
		String date = data[4];	
		String chiefJustice = data[12];

	        String petitioner = data[17];
                String petitionerMeaning = lookUpMeaning("petitioner", petitioner);

                String respondent = data[19];
                String respondentMeaning = lookUpMeaning("respondent", respondent);

	  	String issue = data[39];
                String issueMeaning = lookUpMeaning("issue", issue);
	
		String issueArea = data[40];
		String issueAreaMeaning = lookUpMeaning("issueArea", issueArea);

	
		JSONObject jsonObject = new JSONObject();
		jsonObject.put("date", date);	
		jsonObject.put("chiefJustice", chiefJustice);
		jsonObject.put("issueArea", issueAreaMeaning);
		jsonObject.put("issue", issueMeaning);
		jsonObject.put("petitioner", petitionerMeaning);
		jsonObject.put("respondent", respondentMeaning);

		return jsonObject.toString();			
	}

	private static String lookUpMeaning(String key, String value) throws Exception{
		
		String filepath = "/data/solr-5.4.1/facetData/dataMeaning.csv";
	        BufferedReader meaningBr = new BufferedReader(new FileReader(filepath));
			
		String line;
		while((line = meaningBr.readLine()) != null){
			String [] lookup = line.split(",(?=([^\"]*\"[^\"]*\")*[^\"]*$)");
				
			if((lookup[0].equals(key)) && (lookup[1].equals(value))){
					
					String meaning = lookup[2];
					return meaning;
	
			}
		}
	
		return null;	
	}

}

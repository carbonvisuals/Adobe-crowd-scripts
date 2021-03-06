
/*
Includes the SCALE constructor - this mimics the basic behaviour of d3.scale
*/
﻿#include utilities/scale.jsx
 
/*
Includes the BINS constructor - this takes a max, min and avg value and creates probability 'bins' 
to aid in the distribution of generated values across a given range
*/
#include utilities/bins.jsx

/*
No built-in support for Array.indexOf, so adding it here
*/
Array.prototype.indexOf = Array.prototype.indexOf || function(value, start) {  
      for (var i = 0, length = this.length; i < length; i++) {  
        if (this[i] == value) {  
          return i;  
        }  
      }  
      return -1;  
} 

/*
Creates the variable 'doc' and either assigns the current file to it, or opens a new file and assigns that.
*/
var doc; 

if (app.documents.length > 0) {
    doc = app.activeDocument;
}
else {
    doc = app.documents.add()
}

/*
Creates a new layer named 'Crowd_layer'. This will eventually hold the crowd.
*/
var layer = doc.layers.add()
layer.name = "Crowd_layer"

/*
Array selected_symbols will hold the symbols chosen later by the user from the dialog box.
*/
var selected_symbols = [];

/*
Calls function to create and display dialog box to user
*/
create_dialog ()

function create_dialog () {
	
/*
Creates dialog box and assigns it to variable dlg
*/
    var dlg = new Window("dialog"); 
	
	var w = 350;
	var h = 500;
/*
Sets size of dialog box
*/
    dlg.size = [w, h]
	
/*
Assigns all symbols present in document to symbols variable.
Loops through these, pushing symbol names to new array symbolNameArray.
*/
    var symbols = doc.symbols;
    var symbolNameArray = []
    
    for (var i = 0; i < symbols.length; i++) {
        symbolNameArray.push(symbols[i].name)
    }

/*
Adds control to select a symbol from all availabe using a dropdown list.
*/   
    dlg.symbols = dlg.add('group',undefined, 'Threshold:');
    dlg.symbols.label = dlg.symbols.add('statictext', [15, 15,(w)/2,35], 'select a symbol:');
    dlg.symbols.input = dlg.symbols.add('dropdownlist', [15, 15,(w)/2,35], symbolNameArray); 
    dlg.symbols.orientation='row';


    dlg.symbolPanel = dlg.add('group',undefined, 'Threshold:')
    dlg.symbolPanel.label  = dlg.symbolPanel.add('statictext', [15, 15,w,35], '');
    dlg.symbolPanel.orientation='column';

/*
Adds control to input probability associated with selected symbol.
The probability (as a decimal proportion of 1) sets how often that symbol should appear compared to the others selected
*/ 
    dlg.symbolPanel.probability = dlg.symbolPanel.add('group',undefined, 'Threshold:');
    dlg.symbolPanel.probability.label  = dlg.symbolPanel.probability.add('statictext',[15, 15,(w)/2,35], 'probability:');
    dlg.symbolPanel.probability.input  = dlg.symbolPanel.probability.add('edittext', [15, 15,(w)/2,35], "1"); 
    dlg.symbolPanel.probability.orientation='row';
    
/*
Adds control to input min, max and avg height associated with selected symbol.
*/
    dlg.symbolPanel.height = dlg.symbolPanel.add('group',undefined, 'Threshold:');

/*
Adds control to choose a height input method.
*/
    dlg.symbolPanel.height.radio = dlg.symbolPanel.height.add('group',undefined, 'Threshold:'); 
    dlg.symbolPanel.height.radio.label = dlg.symbolPanel.height.radio.add('statictext', [15, 15,(w)/2,35], 'set height by:');
    dlg.symbolPanel.height.radio.range = dlg.symbolPanel.height.radio.add ("radiobutton", undefined, "range");    
    dlg.symbolPanel.height.radio.value = dlg.symbolPanel.height.radio.add ("radiobutton", undefined, "value");        
    dlg.symbolPanel.height.radio.orientation='row';

/*
Shows and hides height input controls depending on selected radio button
*/
    dlg.symbolPanel.height.radio.range.onClick = function(k){
        if (this.value == true) {
            dlg.symbolPanel.height.value.hide()
            dlg.symbolPanel.height.range.show()
        }
    }

    dlg.symbolPanel.height.radio.value.onClick = function(k){
        if (this.value == true) {
            dlg.symbolPanel.height.range.hide()
            dlg.symbolPanel.height.value.show()
        }
    }
        
/*
Adds control for 'range' height input method - allows user to input min, max and avg heights.
*/
    dlg.symbolPanel.height.range = dlg.symbolPanel.height.add('group',undefined, 'Threshold:');
    dlg.symbolPanel.height.range.label  = dlg.symbolPanel.height.range.add('statictext', [15, 15,(w)/2,35], 'height (min/normal/max):');
    dlg.symbolPanel.height.range.minInput  = dlg.symbolPanel.height.range.add('edittext', [15, 15, (w)/5.6, 35], "1"); 
    dlg.symbolPanel.height.range.normalInput  = dlg.symbolPanel.height.range.add('edittext', [15, 15, (w)/5.6, 35], "1.5"); 
    dlg.symbolPanel.height.range.maxInput  = dlg.symbolPanel.height.range.add('edittext', [15, 15, (w)/5.6, 35], "2"); 
    dlg.symbolPanel.height.range.orientation='row';
    dlg.symbolPanel.height.range.hide()

/*
Adds control for 'value' height input method - allows user to input single height value.
*/
    dlg.symbolPanel.height.value = dlg.symbolPanel.height.add('group',undefined, 'Threshold:');
    dlg.symbolPanel.height.value.label  = dlg.symbolPanel.height.value.add('statictext', [15, 15,(w)/2,35], 'height:');
    dlg.symbolPanel.height.value.input  = dlg.symbolPanel.height.value.add('edittext', [15, 15, (w)/5.6, 35], "1"); 
    dlg.symbolPanel.height.value.orientation='row';
    dlg.symbolPanel.height.value.hide()
    
    dlg.symbolPanel.height.orientation='column';
	
/*
This listbox displays all added symbols to the user so they can see what they've chosen.
*/
    dlg.chosenSymbols = dlg.add('listbox', [15, 15,(w),100], [])

/*
When clicked, this button takes the current symbol, probability and height values and adds them to the array selected_symbols,
also appending to the chosenSymbols listbox.
*/
    dlg.symbolPanel.commit = dlg.symbolPanel.add('button',undefined, "add symbol"); 
    dlg.symbolPanel.commit.addEventListener('click', function(k){
        
        var symbol = {
        	symbol: symbols.getByName(dlg.symbolPanel.label.text),
        	probability: parseFloat(dlg.symbolPanel.probability.input.text)  
        }

/*
Checks which height input field is visible and adds height data to symbol object accordingly.
*/
        if (dlg.symbolPanel.height.range.visible) {
            symbol.height = {
        		min: parseFloat(dlg.symbolPanel.height.range.minInput.text),
        		normal: parseFloat(dlg.symbolPanel.height.range.normalInput.text),
        		max: parseFloat(dlg.symbolPanel.height.range.maxInput.text)
        	}
        }
        else {
            symbol.height = parseFloat(dlg.symbolPanel.height.value.input.text)
        }
    
        selected_symbols.push(symbol)
        
        dlg.chosenSymbols.add("item",  symbol.symbol.name+" "+symbol.probability+" ("+symbol.height.min+", "+symbol.height.normal+", "+symbol.height.max+")")
        
    })
    
/*
Shows and hides the symbol settings panel depending on whether a symbol has been selected from the dropdown.
*/
    dlg.symbolPanel.hide()
    
    dlg.symbols.input.addEventListener('change', function(k){
    	
        dlg.symbolPanel.label.text = this.selection
        dlg.symbolPanel.show()
        
    })
  
/*
When clicked, the submit button hides the dialog box. If one or more symbols have been chosen then process_input function is called.
*/
    dlg.submit = dlg.add('button',undefined, "submit"); 
    dlg.submit.addEventListener('click', function(k){
        	
        	dlg.hide();
            
            if (selected_symbols.length > 0){
               process_input()
            }
    })
	
/*
Shows dialog box to user after it has been fully initialised.
*/
    dlg.show()
} 

function process_input () {
     
	var cumulativeProbability = 0
/*
Loops through all selected symbols, and for each assigns it a lower and upper cumulative probability value.
Also assigns an instance of the BINS object to each selected symbol. This provides a means for that symbol
to choose its height based on a randomly generated probability value.
*/
	for (var i = 0; i < selected_symbols.length; i++){  
        
		selected_symbols[i].cumulativeProbability = {
			lower: +cumulativeProbability,
			upper: +cumulativeProbability + parseFloat(selected_symbols[i].probability)
		}
		
		cumulativeProbability += parseFloat(selected_symbols[i].probability);
		
/*
If a height range has been input, initialise height probability bins.
*/
         
         if (typeof selected_symbols[i].height == "object") {
            selected_symbols[i].bins =  new BINS( selected_symbols[i].height.min,selected_symbols[i].height.max,selected_symbols[i].height.normal).set_num_of_bins(20).generate_bins()
         }
}

/*
Calls read_in_csv to get contents of previously generated array of crowd points.
*/
	read_in_csv ();
}

function read_in_csv () {
/*
Prompts user to select a csv file (created by crowd-call.php) containing point data for the crowd they want to create.
*/
    var csv_file = File.openDialog("Choose a csv File containing your crowd positions:");

/*
Opens file and makes sure file pointer is at beginning.
*/
    csv_file.open('r');
    csv_file.seek(0, 0);
   
/*
Reads first line of csv file (column headers). Checks that there are only 2 columns. If not, doesn't continue running code.
*/
    var ln = csv_file.readln()
    ln = ln.split(',')
    if (ln.length != 2) {
      return  
    }
    
/*
Reads line of the file one by one until the end of the file is reached. 
Calls append_symbol using the first and second column (x and y) vaues.
*/
    while(!csv_file.eof)
    {
         var this_line = csv_file.readln();
         var values = this_line.split(',');
         append_symbol({x: values[0], y: values[1]})
    }
	
/*
Closes the file
*/
    csv_file.close();

}

function append_symbol (position) {
/*
The select_symbol function returns a symbol picked from the available list based on each symbol's probability of being chosen.
*/
         var symbol = select_symbol ();
/*
If a bin is necessary, the select_bin function returns a range within which the selected symbol's 
height may fall.
*/
         var bin;
         if (symbol.bins) {bin = select_bin(symbol.bins)}
	 
/*
Appends symbol to document
*/
		symbolRef = doc.symbolItems.add(symbol.symbol);

/*
If heights should bedynamically chosen from within a range, selects height by picking a random value 
within the limits of bin.
Else uses statically input height value.
*/
		var height = symbol.bins ? bin.min + (Math.random() * (bin.max-bin.min)) : symbol.height;
       
        
/*
Based on the desired height and current height of the symbol, works out what the symbol needs to be scaled by to be the desired height.
*/
        var scale = (height/symbolRef.height)*100
        
/*
Applies scale to symbol.
*/
        symbolRef.resize(scale, scale)

/*
Moves symbol to correct x,y position according to passed in coordinates.
*/
        symbolRef.top =  parseFloat(position.y) + symbolRef.height;
        symbolRef.left = parseFloat(position.x);
	
}

function select_bin (bins) {
	
/*
Creates a random number between 0 and 1, assigns it to random_prob_seed
*/
    var random_prob_seed = Math.random();
	
/*
Creates variable bin to hold chosen bin
*/
    var bin;

/*
Iterates over list of available bins until the cumulative probability associated with the bin exceeds random_prob_seed.
Selects that bin then exits the loop.
*/
     var i;
     var l = bins.length
     for (i=0; i<l; i++) {
           if (random_prob_seed <= bins[i].cumulative_probability ) {
                bin = bins[i]
                break;
           }
     }
 /*
Returns the selected bin
*/
    return bin;
}

function select_symbol () {
/*
Creates a random number between 0 and 1, assigns it to random_prob_seed
*/     
        var random_prob_seed = Math.random();
	
/*
Creates variable symbol to hold chosen symbol
*/
        var symbol;
        
/*
Iterates over list of available symbols until the upper cumulative probability associated with the symbol exceeds random_prob_seed.
Selects that symbol then exits the loop.
*/      
        var i;
        var l = selected_symbols.length
        for (i=0; i<l; i++) {
            if (random_prob_seed <= selected_symbols[i].cumulativeProbability.upper) {
                symbol = selected_symbols[i]
                break;
            }
        }
	
/*
If no symbol has been chosen (because the input probabilities for each symbol did not add up to 1) 
uses the first chosen symbol as default.
*/ 
        if (!symbol) {
            symbol = selected_symbols[0];
        }
/*
Returns the selected symbol
*/
        return symbol;
}

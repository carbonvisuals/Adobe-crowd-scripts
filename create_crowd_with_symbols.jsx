
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

/*This will hold the symbols chosen later by the user from the dialog box.
*/
var selected_symbols = [];

create_dialog ()

function create_dialog () {
    
    var dlg = new Window("dialog"); 
	
	var w = 350;
	var h = 500;
	
    dlg.size = [w, h]
    
    var symbols = doc.symbols;
    var symbolNameArray = []
    
    for (var i = 0; i < symbols.length; i++) {
        symbolNameArray.push(symbols[i].name)
    }

   
    
    
    dlg.symbols = dlg.add('group',undefined, 'Threshold:');
    dlg.symbols.label = dlg.symbols.add('statictext', [15, 15,(w)/2,35], 'select a symbol:');
    dlg.symbols.input = dlg.symbols.add('dropdownlist', [15, 15,(w)/2,35], symbolNameArray); 
    dlg.symbols.orientation='row';
    
    dlg.symbolPanel = dlg.add('group',undefined, 'Threshold:')
    dlg.symbolPanel.label  = dlg.symbolPanel.add('statictext', [15, 15,w,35], '');
    dlg.symbolPanel.orientation='column';
    
    dlg.symbolPanel.probability = dlg.symbolPanel.add('group',undefined, 'Threshold:');
    dlg.symbolPanel.probability.label  = dlg.symbolPanel.probability.add('statictext',[15, 15,(w)/2,35], 'probability:');
    dlg.symbolPanel.probability.input  = dlg.symbolPanel.probability.add('edittext', [15, 15,(w)/2,35], "1"); 
    dlg.symbolPanel.probability.orientation='row';
    
    dlg.symbolPanel.height = dlg.symbolPanel.add('group',undefined, 'Threshold:');
    dlg.symbolPanel.height.label  = dlg.symbolPanel.height.add('statictext', [15, 15,(w)/2,35], 'height (min/normal/max):');
    dlg.symbolPanel.height.minInput  = dlg.symbolPanel.height.add('edittext', [15, 15, (w)/5.6, 35], "100"); 
    dlg.symbolPanel.height.normalInput  = dlg.symbolPanel.height.add('edittext', [15, 15, (w)/5.6, 35], "150"); 
    dlg.symbolPanel.height.maxInput  = dlg.symbolPanel.height.add('edittext', [15, 15, (w)/5.6, 35], "200"); 
    dlg.symbolPanel.height.orientation='row';
    
    dlg.chosenSymbols = dlg.add('listbox', [15, 15,(w),100], [])
    
    dlg.symbolPanel.commit = dlg.symbolPanel.add('button',undefined, "add symbol"); 
    dlg.symbolPanel.commit.addEventListener('click', function(k){
        
        var symbol = {
        	symbol: symbols.getByName(dlg.symbolPanel.label.text),
        	probability: parseFloat(dlg.symbolPanel.probability.input.text),
        	height: {
        		min: parseFloat(dlg.symbolPanel.height.minInput.text),
        		normal: parseFloat(dlg.symbolPanel.height.normalInput.text),
        		max: parseFloat(dlg.symbolPanel.height.maxInput.text)
        	} 
        }
    
        selected_symbols.push(symbol)
        
        dlg.chosenSymbols.add("item",  symbol.symbol.name+" "+symbol.probability+" ("+symbol.height.min+", "+symbol.height.normal+", "+symbol.height.max+")")
        
    })
    
    dlg.symbolPanel.hide()
    
    dlg.symbols.input.addEventListener('change', function(k){
    	
        dlg.symbolPanel.label.text = this.selection
        dlg.symbolPanel.show()
        
    })
    
    dlg.submit = dlg.add('button',undefined, "submit"); 
    dlg.submit.addEventListener('click', function(k){
        	
        	dlg.hide();
            
            if (selected_symbols.length > 0){
               process_input()
            }
    })

    dlg.show()
} 

function process_input () {
     
	var cumulativeProbability = 0
	
	for (var i = 0; i < selected_symbols.length; i++){  
        
		selected_symbols[i].cumulativeProbability = {
			lower: +cumulativeProbability,
			upper: +cumulativeProbability + parseFloat(selected_symbols[i].probability)
		}
		
		cumulativeProbability += parseFloat(selected_symbols[i].probability);
		
		selected_symbols[i].bins =  new BINS( selected_symbols[i].height.min,selected_symbols[i].height.max,selected_symbols[i].height.normal).set_num_of_bins(20).generate_bins()
	}
	read_in_csv ();
}

function read_in_csv () {
    //var csv_file = new File("/Applications/Adobe Illustrator CC 2015.3/Presets.localized/en_GB/Scripts/crowd/crowd-db.csv");
    var csv_file = File.openDialog("Choose a csv File containing your crowd positions:");
    csv_file.open('r');
    csv_file.seek(0, 0);
     
    var ln = csv_file.readln()
    ln = ln.split(',')
    if (ln.length != 2) {
      return  
    }
    
    while(!csv_file.eof)
    {
         var this_line = csv_file.readln();
         var values = this_line.split(',');
         append_symbol({x: values[0], y: values[1]})
    }
    csv_file.close();

}

function append_symbol (position) {
        
         var symbol = select_symbol ();
         var bin = select_bin(symbol.bins)		
		symbolRef = doc.symbolItems.add(symbol.symbol);

		var height = bin.min + (Math.random() * (bin.max-bin.min))
        
        var scale = (height/symbolRef.height)*100
        
        symbolRef.resize(scale, scale)
        
        symbolRef.top =  parseFloat(position.y) + symbolRef.height;
        symbolRef.left = parseFloat(position.x);
	
}

function select_bin (bins) {
    var random_prob_seed = Math.random();
    var bin;
    
     var i;
     var l = bins.length
     for (i=0; i<l; i++) {
           if (random_prob_seed <= bins[i].cumulative_probability ) {
                bin = bins[i]
                break;
           }
     }
 
    return bin;
}

function select_symbol () {
        
        var random_prob_seed = Math.random();
        var symbol;
        
        
        var i;
        var l = selected_symbols.length
        for (i=0; i<l; i++) {
            if (random_prob_seed <= selected_symbols[i].cumulativeProbability.upper) {
                symbol = selected_symbols[i]
                break;
            }
        }
    
        if (!symbol) {
            symbol = selected_symbols[0];
        }

        return symbol;
}

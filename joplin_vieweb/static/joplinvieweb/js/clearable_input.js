/**
 * Clearable text inputs.
 * From https://stackoverflow.com/questions/6258521/clear-icon-inside-input-text
 */
function tog(v){return v ? "addClass" : "removeClass";} 
$(document)
// .on("input", ".clearable", function(){
//     $(this)[tog(this.value)]("x");
// }).on("mousemove", ".x", function( e ){
//     $(this)[tog(this.offsetWidth-18 < e.clientX-this.getBoundingClientRect().left)]("onX");
// })
.on("touchstart click", ".onX", function( ev ){
    ev.preventDefault();
    //$(this).removeClass("x onX").val("").change();
    $(this).val("").change();
});

//$('.clearable').trigger("input");
//Uncomment the line above if you pre-fill values from LS or server
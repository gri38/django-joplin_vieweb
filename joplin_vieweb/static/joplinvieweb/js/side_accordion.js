$(document).ready(function() {  
    $("#tags").toggle();
    $("#notebooks_tree_ctn").css("flex", "1 1 auto");
    $("#tags_ctn").css("flex", "0 0 auto");
    
    $(".header").click(toggle_side);
});

function toggle_side() {
    g1 = $("#notebooks_tree_ctn").css("flex-grow");
    s1 = $("#notebooks_tree_ctn").css("flex-shrink");
    b1 = $("#notebooks_tree_ctn").css("flex-basis");
    g2 = $("#tags_ctn").css("flex-grow");
    s2 = $("#tags_ctn").css("flex-shrink");
    b2 = $("#tags_ctn").css("flex-basis");

    $("#tags").toggle(400);
    $("#notebooks_tree").toggle(400);

    $("#notebooks_tree_ctn").css("flex-grow", g2);
    $("#notebooks_tree_ctn").css("flex-shrink", s2);
    $("#notebooks_tree_ctn").css("flex-basis", b2);
    $("#tags_ctn").css("flex-grow", g1);
    $("#tags_ctn").css("flex-shrink", s1);
    $("#tags_ctn").css("flex-basis", b1);
    
}


/**********************************************************************
    Freeciv-web - the web version of Freeciv. http://play.freeciv.org/
    Copyright (C) 2009-2015  The Freeciv-web project

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

***********************************************************************/

var toplevel_menu_items = ["help_terrain", "help_economy", "help_cities",
    "help_city_improvements", "help_wonders_of_the_world", "help_units",
    "help_combat", "help_technology", "help_government"];
var hidden_menu_items = ["help_connecting", "help_languages", "help_governor",
    "help_chatline", "help_about", "help_worklist_editor"];

/**************************************************************************
 Show the Freeciv-web Help Dialog
**************************************************************************/
function show_help()
{
  $("#tabs-hel").show();
  $("#help_footer").hide();$("#help_footer").remove();
  $("#help_menu").remove();
  $("#help_info_page").remove();
  $("<ul id='help_menu'></ul><div id='help_info_page'></div>").appendTo("#tabs-hel");
  for (var sec_id in helpdata_order) {
    var key = helpdata_order[sec_id];
    if (hidden_menu_items.indexOf(key) > -1) {
      continue;
    } else if (key.indexOf("help_gen") != -1) {
      generate_help_menu(key);
    } else if (toplevel_menu_items.indexOf(key) > -1) {
      generate_help_toplevel(key);
    } else {
      var parent_key = find_parent_help_key(key);
      $("<li id='" + key +  "' data-helptag='" + key +  "'>"
        + helpdata_tag_to_title(key) + "</li>").appendTo(parent_key);
    }
  }

  $("#help_menu").menu({
    select: function( event, ui ) {handle_help_menu_select(ui); }
  });

  show_help_intro();
  $("#tabs-hel").css("height", $(window).height() - 60);

  if (is_small_screen()) {
    $("#help_info_page").css("max-width", $(window).width()-165);
    $("#help_info_page").css({"margin":"0px","padding":"0px","font-size":"90%"});
    $("#help_footer").remove();
    $("#help_footer").hide();
  } else {
    $("#help_info_page").css("max-width", $(window).width() - $("#help_menu").width() - 60);
    $("#help_footer").show();
  }
}

/**************************************************************************
...
**************************************************************************/
function show_help_intro()
{
  $.get( "/docs/help_intro.txt", function( data ) {
      $("#help_info_page").html(data);
  });
}

/**************************************************************************
...
**************************************************************************/
function generate_help_menu(key)
{
  var impr_id;
  var improvement;
  if (key == "help_gen_terrain") {
    for (var terrain_id in terrains) {
      var terrain = terrains[terrain_id];
      $("<li data-helptag='" + key + "_" + terrain['id'] + "'>"
        + terrain['name'] + "</li>").appendTo("#help_terrain_ul");
    }
  } else if (key == "help_gen_improvements") {
    for (impr_id in improvements) {
      improvement = improvements[impr_id];
      if (is_wonder(improvement)) continue;

      // Suppress improvements if server settings don't allow them:
      if (!server_settings['nukes_major']['val']
          && improvement['name'] == "Enrichment Facility") {
            continue; // if major nukes are OFF, suppress illegal prod choice.
      }

      $("<li data-helptag='" + key + "_" + improvement['id'] + "'>"
        + improvement['name'] + "</li>").appendTo("#help_city_improvements_ul");
    }
  } else if (key == "help_gen_wonders") {
    for (impr_id in improvements) {
      improvement = improvements[impr_id];
      if (!is_wonder(improvement)) continue;

      // Suppress improvements if server settings don't allow them:
      if (!server_settings['nukes_minor']['val']
          && improvement['name'] == "Manhattan Project") {
          continue; // if major nukes are OFF, suppress illegal prod choice.
      }
      
      $("<li data-helptag='" + key + "_" + improvement['id'] + "'>"
        + improvement['name'] + "</li>").appendTo("#help_wonders_of_the_world_ul");
    }
  } else if (key == "help_gen_units") {
    for (var i = 0; i < unittype_ids_alphabetic().length; i++) {
      var unit_id = unittype_ids_alphabetic()[i];
      var punit_type = unit_types[unit_id];

      if (utype_has_flag(punit_type, UTYF_NUCLEAR)) {
        if (!server_settings['nukes_minor']['val']) continue; // Nukes totally turned off in this game, skip them
        if (!server_settings['nukes_major']['val']) { // bombard_rate !=0 or !=-1 is a major nuke, skip if game settings have turned it off.
          if (punit_type['bombard_rate']>0) continue;
          if (punit_type['bombard_rate']<-1) continue;
        }
      }

      $("<li data-helptag='" + key + "_" + punit_type['id'] + "'>"
         + punit_type['name'] + "</li>").appendTo("#help_units_ul");
    }
  } else if (key == "help_gen_techs") {
    for (var tech_id in techs) {
      var tech = techs[tech_id];
      if (tech_id == 0) continue;
      $("<li data-helptag='" + key + "_" + tech['id'] + "'>"
          + tech['name'] + "</li>").appendTo("#help_technology_ul");
    }
  } else if (key == "help_gen_governments") {
    for (var gov_id in governments) {
      var pgov = governments[gov_id];

      $("<li data-helptag='" + key + "_" + pgov['id'] + "'>"
          + pgov['name'] + "</li>").appendTo("#help_government_ul");
    }
  } else if (key == "help_gen_ruleset") {
    $("<li id='" + key +  "' data-helptag='" + key +  "'>"
       + "About Current Ruleset" + "</li>").appendTo(
          find_parent_help_key(key));
  }
}

/**************************************************************************
...
**************************************************************************/
function render_sprite(sprite)
{
  var msg = "<div class='help_unit_image' style=' background: transparent url("
           + sprite['image-src'] +
           ");background-position:-" + sprite['tileset-x'] + "px -" + sprite['tileset-y']
           + "px;  width: " + sprite['width'] + "px;height: " + sprite['height'] + "px;'"
           +"></div>";
  return msg;
}

/**************************************************************************
...
**************************************************************************/
function generate_help_toplevel(key)
{
  var parent_key = find_parent_help_key(key);
  $("<li id='" + key +  "' data-helptag='" + key +  "'>"
     + helpdata_tag_to_title(key) + "</li>").appendTo(parent_key);
  $("<ul id='" + key + "_ul' class='help_submenu'></ul>").appendTo("#" + key);
}

/**************************************************************************
...
**************************************************************************/
function find_parent_help_key(key)
{
  if (key == "help_terrain_alterations") {
    return "#help_terrain_ul";
  } else if (key == "help_villages" || key == "help_borders") {
    return "#help_terrain_ul";
  } else if (key == "help_food" || key == "help_production" || key == "help_trade") {
    return "#help_economy_ul";
  } else if (key == "help_specialists" || key == "help_happiness" || key == "help_pollution"
        || key == "help_plague" || key == "help_migration") {
    return "#help_cities_ul";
  } else if (key == "help_combat_example_1" || key == "help_combat_example_2") {
    return "#help_combat_ul";
  } else  {
    return "#help_menu";
  }
}

/**************************************************************************
...
**************************************************************************/
function handle_help_menu_select( ui )
{
  var selected_tag = $(ui.item).data("helptag");
  if (selected_tag.indexOf("help_gen") != -1) {
    generate_help_text(selected_tag);
  } else if (selected_tag == "help_copying") {
    $.get( "/docs/LICENSE.txt", function( data ) {
      $("#help_info_page").html("<h1>Freeciv-Web License</h1>" + data.replace(/\n/g, "<br>"));
    });
    clear_sidebar();
  } else if (selected_tag == "help_controls") {
    $.get( "/docs/controls.txt", function( data ) {
      $("#help_info_page").html(data.replace(/\n/g, "<br>"));
    });
    clear_sidebar();
  } else {
    var msg = "<h1>" + helpdata_tag_to_title(selected_tag) + "</h1>" + helpdata[selected_tag]['text'];
    $("#help_info_page").html(msg);
  }

  $("#help_info_page").focus();
}

/**************************************************************************
  Clears sidebar if on mobile, to make room for other stuff.
**************************************************************************/
function clear_sidebar()
{
  if (is_small_screen())
  { 
    $("#help_info_page").css("max-width",$(window).width());
    $("#help_info_page").css("padding","1px");
    $("#help_menu").hide();
  }
}

/**************************************************************************
  Returns a button that shows the extracted Wikipedia data about an item.

  Returns an empty string ("") if no such data exists.
**************************************************************************/
function wiki_on_item_button(item_name)
{
  /* Item name shouldn't be a qualified string. */
  item_name = string_unqualify(item_name);

  if (freeciv_wiki_docs[item_name] == null) {
    console.log("No wiki data about " + item_name);
    return "";
  }

  return ("<button class='help_button' onclick=\"show_wikipedia_dialog('"
          + item_name.replace(/'/g, "\\'") + "');\">Wikipedia on "
          + item_name +  "</button>");
}

/**************************************************************************
  Format a long text description of the current ruleset.
**************************************************************************/
function helpdata_format_current_ruleset()
{
  var msg = "";
  if (ruleset_control != null) {
    msg += "<h1>" + ruleset_control['name'] + "</h1>";
  }
  if (ruleset_summary != null) {
    msg += "<p>" + ruleset_summary.replace(/\n/g, "<br>") + "</p>";
  }
  if (ruleset_description != null) {
    msg += "<p>" + ruleset_description.replace(/\n/g, "<br>") + "</p>";
  }
  return msg;
}

/**************************************************************************
...
**************************************************************************/
function generate_help_text(key)
{
  var flx_tab = "0.30";  // alignment spacing for unit stats
  // Temporarily maximize horizontal space for mobile
  if (is_small_screen())
  { 
    $("#help_info_page").css("max-width",$(window).width());
    $("#help_info_page").css("padding","1px");
    $("#help_menu").hide();
    flx_tab = "0.55";
  }

  var rulesetdir = ruledir_from_ruleset_name(ruleset_control['name'], "");
  var msg = "";
  const hr = "<hr style='border-top: 1px solid #000'>";

  if (key.indexOf("help_gen_terrain") != -1) {
    var terrain = terrains[parseInt(key.replace("help_gen_terrain_", ""))];
    msg = "<h1>" + terrain['name'] + "</h1>" + terrain['helptext']
	    + "<br><br>Movement cost: " + terrain['movement_cost']
	    + "<br>Defense bonus: " + terrain['defense_bonus']
	    + "<br>Food/Prod/Trade: " + terrain['output'][0] + "/"
	    + terrain['output'][1] + "/" + terrain['output'][2];
  } else if (key.indexOf("help_gen_improvements") != -1 || key.indexOf("help_gen_wonders") != -1) {
    var improvement = improvements[parseInt(key.replace("help_gen_wonders_", "").replace("help_gen_improvements_", ""))];
    msg = "<h1>" + improvement['name'] + "</h1>"
	    + render_sprite(get_improvement_image_sprite(improvement)) + "<br>"
	    + improvement['helptext']
            + "<br><br>Cost: " + improvement['build_cost']
            + "<br>Upkeep: " + improvement['upkeep'];
    var reqs = get_improvement_requirements(improvement['id']);
    if (reqs != null) {
      msg += "<br>Requirements: ";
      for (var n = 0; n < reqs.length; n++) {
       msg += techs[reqs[n]]['name'] + " ";
      }
    }
    msg += "<br><br>";
    msg += wiki_on_item_button(improvement['name']);
  } else if (key.indexOf("help_gen_units") != -1) {
    var obsolete_by;
    var punit_type
        = unit_types[parseInt(key.replace("help_gen_units_", ""))];
    var punit_class
        = unit_classes[punit_type['unit_class_id']];
    var flex = " style='display:flex;' ";
    var span1 = "<span style='flex:"+flx_tab+";'>";
    var span2 = "<span style='font-weight:bold; color:#014;'>";
    var span_end = "</span>";
    var div_end = "</span></div>"

    msg = "<h1 style='margin-top:0px;font-size:190%'>" + punit_type['name'] + "</h1>";
    msg += "<div style='margin-bottom:10px;margin-top:-10px'>"+render_sprite(get_unit_type_image_sprite(punit_type))+"</div>";
    //msg += "<br>";
    msg += "<div id='manual_non_helptext_facts' style='max-width:984px;'>";
    // COST
    msg += "<div"+flex+"id='utype_fact_cost'>";
    msg += span1 + "Cost: " + span_end + span2 + punit_type['build_cost'] + div_end;
    // ATTACK
    msg += "<div"+flex+" id='utype_fact_attack_str'>";
    msg += span1 + "Attack: " + span_end + span2 + punit_type['attack_strength'] + div_end;
    // DEFENSE
    msg += "<div"+flex+" id='utype_fact_defense_str'>";
    msg += span1 + "Defense: " + span_end + span2 + punit_type['defense_strength'] + div_end;
    // FIREPOWER
    msg += "<div"+flex+" id='utype_fact_firepower'>";
    msg += span1 + "Firepower: " + span_end + span2 + punit_type['firepower'] + div_end;
    // HITPOINTS
    msg += "<div"+flex+" id='utype_fact_hp'>";
    msg += span1 + "Hitpoints: " + span_end + span2 + punit_type['hp'] + div_end;
    // MOVE RATE
    msg += "<div"+flex+" id='utype_fact_move_rate'>";
    msg += span1+"Moves: " + span_end + span2 + move_points_text(punit_type['move_rate']) + div_end;
    // VISION
    msg += "<div"+flex+" id='utype_fact_vision'>";
    msg += span1 + "Vision: " + span_end + span2 + punit_type['vision_radius_sq'] + div_end;
    // FUEL
    if (punit_type['fuel']>0) {
      msg += "<div"+flex+" id='utype_fact_fuel'>";
      msg += span1 + "Fuel: " + span_end + span2 + punit_type['fuel'];
      msg += div_end;
    }
    // CARGO CAPACITY
    if (punit_type['transport_capacity']>0) {
      msg += "<div"+flex+" id='utype_fact_cargo'>";
      msg += span1 + "Cargo: " + span_end + span2 + punit_type['transport_capacity'];
      msg += div_end;
    }
    // MIN_SPEED
    msg += "<div"+flex+" id='utype_fact_minspeed'>";
    msg += span1 + "Min_speed: " + span_end + span2;
    if (utype_has_class_flag(punit_type, UCF_DAMAGE_SLOWS))
      msg += move_points_text(punit_class['min_speed']);
    else msg += "100%";
    msg += div_end;
    // UPKEEP
    msg += "<div"+flex+" id='utype_fact_upkeep'></span></div>";
    // IMPROVEMENT REQS
    if (improvements[punit_type['impr_requirement']]) // if an impr_req exists to make this unit
    {
      msg += "<div"+flex+" id='utype_fact_req_building'>";
      msg += span1 + "Building Reqs: " + span_end + span2;
      msg += improvements[punit_type['impr_requirement']]['name'] + " ";
      msg +=  div_end;
    }
    // TECH REQS
    var treq = punit_type['tech_requirement'];
    if (treq != null && techs[treq] != null) {
      msg += "<div"+flex+" id='utype_fact_req_tech'>";
      msg += span1 + "Tech Req: " + span_end + span2 + techs[treq]['name'] + div_end;
    }
    // OBSOLETE BY
    obsolete_by = unit_types[punit_type['obsoleted_by']];
    msg += "<div"+flex+" id='utype_fact_obsolete'>";
    msg += span1 + "Obsolete by: " + span_end + span2;
    if (obsolete_by == U_NOT_OBSOLETED) {
      msg += "None";
    } else {
      msg += obsolete_by['name'];
    }
    msg += div_end;

    msg += "</div>"+hr;

    msg += "<div id='helptext' style='font-weight:500; max-width:984px'><p>" + punit_type['helptext'] + "</p></div>"+hr;

    msg += wiki_on_item_button(punit_type['name']);

    msg += "<div id='datastore' hidden='true'></div>";
  } else if (key.indexOf("help_gen_techs") != -1) {
    var tech = techs[parseInt(key.replace("help_gen_techs_", ""))];
    msg = "<h1>" + tech['name'] + "</h1>"
	    + render_sprite(get_technology_image_sprite(tech)) + "<br>"
	    + get_advances_text(tech['id']);
    msg += "<br><br>";
    msg += "<div id='helptext'><p>" + tech['helptext'] + "</p></div>";

    msg += wiki_on_item_button(tech['name']);
  } else if (key == "help_gen_ruleset") {
    msg = helpdata_format_current_ruleset();
  } else if (key.indexOf("help_gen_governments") != -1) {
    var pgov = governments[parseInt(key.replace("help_gen_governments_",
                                                ""))];

    msg = "<h1>" + pgov['name'] + "</h1>";
    msg += "<div id='helptext'><p>" + pgov['helptext'] + "</p></div>";

    msg += wiki_on_item_button(pgov['name']);
  }

  $("#help_info_page").html(msg);

  /* Freeciv has code that generates certain help texts based on the
   * ruleset. This code is written in C. It is huge. Replicating it in
   * JavaScript would be a huge task and probably introduce bugs. Even if
   * someone did it it would be hard to keep the replicated code in sync as
   * the corresponding Freeciv C code kept evolving.
   *
   * Freeciv has the tool freeciv-manual. It can use the ruleset based auto
   * help text generation. It can output HTML. Some of its HTML output is
   * machine readable enough to be usable for Freeciv-web.
   *
   * Use the machine readable and wanted parts of freeciv-manual's output to
   * add auto generated help texts for the current ruleset. */
  if (rulesetdir.length != 0) {
    if (key.indexOf("help_gen_units") != -1) {
      var utype_id = parseInt(key.replace("help_gen_units_", ""));

      /* Add the auto generated unit type facts freeciv-manual prepends to
       * the unit type's help text. */
      $("#helptext").load("../man/" + rulesetdir + "7.html #utype"
                          + utype_id + " .helptext");

      /* Add the utype upkeep from freeciv-manual. */
      $("#datastore").load("../man/" + rulesetdir + "7.html #utype"
                           + utype_id + " .upkeep", function() {
                             $("#utype_fact_upkeep")[0].innerHTML
                                 = $("#datastore")[0].children[0].innerHTML.replace(
                                   "Upkeep:",
                                   span1+"Upkeep:&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;"+span_end+span2);
                           });
                           
    } else if (key.indexOf("help_gen_governments") != -1) {
      var gov_id = parseInt(key.replace("help_gen_governments_", ""));

      /* Add the auto generated government facts freeciv-manual prepends to
       * the government type's help text. */
      $("#helptext").load("../man/" + rulesetdir + "6.html #gov"
                          + gov_id + " .helptext");
    }
  }

  $(".help_button").button();
}

/**************************************************************************
...
**************************************************************************/
function helpdata_tag_to_title(tag)
{
  var result = tag.replace("_of_the_world", "").replace("help_", "").replace("gen_", "").replace("misc_", "").replace(/_/g, " ");
  return to_title_case(result);
}

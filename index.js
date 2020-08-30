

window.onscroll = function() {myFunction()};

function changeElements(background, title, footer, names=""){
  document.getElementById("imagecontainer").style.backgroundImage = background;
  document.getElementById("img_title").innerHTML = title;
  // document.getElementById("footer").innerHTML = footer;
}

function myFunction() {
  var margin = 200;
  if (document.body.scrollTop > margin * 21 || document.documentElement.scrollTop > margin * 21) {
    changeElements("url('')",
    "Flatten the Curve: Fingerprints",
    "")
    d3.select("#imagecontainer").style("width", "0%").style("height","0%")
  } else if (document.body.scrollTop > margin * 20|| docx`ument.documentElement.scrollTop > margin * 20) {
    changeElements("url('images/Explainer.png')",
    "Flatten the Curve: Fingerprint Explainer",
    "")
    d3.select('imagecontainer').style("width", "80%").style("height", "90%")
  } else if (document.body.scrollTop > margin * 10 || document.documentElement.scrollTop > margin * 10) {
    changeElements("url('')",
    "Flatten the Curve: Graphs",
    "")
  } else if (document.body.scrollTop > margin * 5 || document.documentElement.scrollTop > margin * 5) {
    changeElements("url('images/Orders_2.gif')",
    "Flatten the Curve: Introduction to Policies",
    "")
  } else {
    changeElements("url('images/Orders_1.gif')",
    "Flatten the Curve: Introduction to Policies",
    "Mess of Orders"
  )
  }
}

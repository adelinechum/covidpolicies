

window.onscroll = function() {myFunction()};

function changeElements(background, title, footer, names=""){
  document.getElementById("imagecontainer").style.backgroundImage = background;
  document.getElementById("title").innerHTML = title;
  // document.getElementById("footer").innerHTML = footer;
}

function myFunction() {
  var margin = 200;
  if (document.body.scrollTop > margin * 30 || document.documentElement.scrollTop > margin * 30) {
    changeElements("url('')",
    "Flatten the Curve: Fingerprints",
    "")
  } else if (document.body.scrollTop > margin * 25|| document.documentElement.scrollTop > margin * 25) {
    changeElements("url('images/Explainer.png')",
    "Flatten the Curve: Fingerprint Explainer",
    "")
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

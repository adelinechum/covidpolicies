

window.onscroll = function() {myFunction()};

function changeElements(background, title, footer, names=""){
  document.getElementById("header_bar").style.backgroundImage = background;
  document.getElementById("title").innerHTML = title;
  // document.getElementById("footer").innerHTML = footer;
}

function myFunction() {
  var margin = 200;
  if (document.body.scrollTop > margin * 20 || document.documentElement.scrollTop > margin * 20) {
    changeElements("url('')",
    "Flatten the Curve: Fingerprints",
    "")
  } else if (document.body.scrollTop > margin * 15|| document.documentElement.scrollTop > margin * 11) {
    changeElements("url('images/Explainer.png')",
    "Flatten the Curve: Fingerprint Explainer",
    "The Coastal GasLink pipeline plans to cut through several indigenious territories.")
  } else if (document.body.scrollTop > margin * 5 || document.documentElement.scrollTop > margin * 3.5) {
    changeElements("url('')",
    "Flatten the Curve: Graphs",
    "")
  } else {
    changeElements("url('images/Orders.gif')",
    "Flatten the Curve: Introduction to Policies",
    "Mess of Orders"
  )
  }
}

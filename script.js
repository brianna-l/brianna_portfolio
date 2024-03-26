// select our container element
var containerElement = document.querySelector('.Container');

// insert single costume function
function insertCostume(costume) {

	// put costume into HTML
	containerElement.innerHTML += `
		<main class="cover" data-costume="${ costume['title'] }">
			<img src="media/${ costume['image'] }"/>
            <h2>${ costume['title'] }</h2>
		</main>
	`;

}

// insert costumes function definition
function insertCostumes(costumes) {

	// empty the container element
	containerElement.innerHTML = '';

	// for each costume...
	costumes.forEach((costume) => {
		// insert costume
		insertCostume(costume);
	});

}
// insert all costumes into DOM
insertCostumes(costumes);
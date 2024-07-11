function simulatePanleukapaniaSpread(
	population,
	initialInfected,
	transmissionRate,
	recoveryRate,
	reinfectionRate,
	kittenPercentage,
	vaccinatedPercentage,
	treatmentPercentage,
	sheddingRate,
	environmentalTransmissionRate,
	virusDecayRate,
	simulationDays
) {
	let susceptible = population - initialInfected;
	let exposed = 0;
	let incubating = 0;
	let infected = initialInfected;
	let recovered = 0;
	let deaths = 0;
	let environmentalVirus = 0;

	const dailyStats = [{
		day: 0,
		susceptible,
		exposed,
		incubating,
		infected,
		recovered,
		deaths,
		environmentalVirus
	}];

	for (let day = 1; day <= simulationDays; day++) {
		if (susceptible + exposed + incubating + infected + recovered === 0) {
			break; // Stop simulation if all cats have died
		}

		// Direct transmission
		const directTransmissions = Math.round(infected * susceptible * transmissionRate / population);

		// Environmental transmission
		const environmentalTransmissions = Math.round(susceptible * environmentalVirus * environmentalTransmissionRate / population);

		// Total new exposures
		const newExposures = Math.min(susceptible, directTransmissions + environmentalTransmissions);

		// Move cats from exposed to incubating (assume 2-day exposure period)
		const newlyIncubating = Math.round(exposed / 2);

		// Move cats from incubating to infected (assume 4-day incubation period)
		const newlyInfected = Math.round(incubating / 4);

		// Calculate deaths based on age, vaccination, and treatment status
		const kittenDeaths = Math.round(infected * kittenPercentage * 0.9); // 90% mortality for kittens
		const unvaccinatedDeaths = Math.round(infected * (1 - kittenPercentage) * (1 - vaccinatedPercentage) * (treatmentPercentage ? 0.5 : 0.85));
		const vaccinatedDeaths = Math.round(infected * (1 - kittenPercentage) * vaccinatedPercentage * (treatmentPercentage ? 0.1 : 0.15));
		const newDeaths = kittenDeaths + unvaccinatedDeaths + vaccinatedDeaths;

		// Recoveries
		const newRecoveries = Math.round(infected * recoveryRate);

		// Reinfections
		const reinfections = Math.round(recovered * reinfectionRate);

		// Update population groups
		susceptible = susceptible - newExposures;
		exposed = exposed + newExposures - newlyIncubating;
		incubating = incubating + newlyIncubating - newlyInfected;
		infected = infected + newlyInfected + reinfections - newRecoveries - newDeaths;
		recovered = recovered + newRecoveries - reinfections;
		deaths += newDeaths;

		// Update environmental virus
		environmentalVirus = environmentalVirus * (1 - virusDecayRate) + infected * sheddingRate;

		// Ensure we don't have negative values
		susceptible = Math.max(0, susceptible);
		exposed = Math.max(0, exposed);
		incubating = Math.max(0, incubating);
		infected = Math.max(0, infected);
		recovered = Math.max(0, recovered);
		environmentalVirus = Math.max(0, environmentalVirus);

		dailyStats.push({
			day,
			susceptible,
			exposed,
			incubating,
			infected,
			recovered,
			deaths,
			environmentalVirus
		});
	}

	return dailyStats;
}

function displayResults(results) {
	const resultDiv = document.getElementById('result');
	resultDiv.innerHTML = '';

	const container = document.createElement('div');
	container.id = 'result-container';

	const table = document.createElement('table');
	table.innerHTML = `
		<thead>
			<tr>
				<th>Day</th>
				<th>Susceptible</th>
				<th>Exposed</th>
				<th>Incubating</th>
				<th>Infected</th>
				<th>Recovered</th>
				<th>Deaths</th>
				<th>Environmental Virus</th>
			</tr>
		</thead>
		<tbody id="results-body">
		</tbody>
	`;

	container.appendChild(table);
	resultDiv.appendChild(container);

	if (results[results.length - 1].susceptible + results[results.length - 1].exposed + results[results.length - 1].incubating + results[results.length - 1].infected + results[results.length - 1].recovered === 0) {
		const message = document.createElement('p');
		message.textContent = `Simulation ended early on day ${results.length - 1} as all cats died.`;
		message.className = 'early-end-message';
		resultDiv.insertBefore(message, container);
	}

	const tbody = document.getElementById('results-body');
	results.forEach(day => {
		const row = document.createElement('tr');
		row.innerHTML = `
			<td>${day.day}</td>
			<td>${day.susceptible}</td>
			<td>${day.exposed}</td>
			<td>${day.incubating}</td>
			<td>${day.infected}</td>
			<td>${day.recovered}</td>
			<td>${day.deaths}</td>
			<td>${day.environmentalVirus.toFixed(2)}</td>
		`;
		tbody.appendChild(row);
	});
}

document.getElementById('simulationForm').addEventListener('submit', function (event) {
	event.preventDefault();

	const formData = new FormData(event.target);
	const population = parseInt(formData.get('population'));
	const initialInfected = parseInt(formData.get('initialInfected'));
	const transmissionRate = parseFloat(formData.get('transmissionRate'));
	const recoveryRate = parseFloat(formData.get('recoveryRate'));
	const reinfectionRate = parseFloat(formData.get('reinfectionRate'));
	const kittenPercentage = parseFloat(formData.get('kittenPercentage'));
	const vaccinatedPercentage = parseFloat(formData.get('vaccinatedPercentage'));
	const treatmentPercentage = parseFloat(formData.get('treatmentPercentage'));
	const sheddingRate = parseFloat(formData.get('sheddingRate'));
	const environmentalTransmissionRate = parseFloat(formData.get('environmentalTransmissionRate'));
	const virusDecayRate = parseFloat(formData.get('virusDecayRate'));
	const simulationDays = parseInt(formData.get('simulationDays'));

	const results = simulatePanleukapaniaSpread(
		population,
		initialInfected,
		transmissionRate,
		recoveryRate,
		reinfectionRate,
		kittenPercentage,
		vaccinatedPercentage,
		treatmentPercentage,
		sheddingRate,
		environmentalTransmissionRate,
		virusDecayRate,
		simulationDays
	);

	displayResults(results);
});
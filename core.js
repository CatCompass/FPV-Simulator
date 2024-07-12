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
		const directTransmissions = binomialSample(susceptible, transmissionRate * infected / population);

		// Environmental transmission
		const environmentalTransmissions = binomialSample(susceptible, environmentalTransmissionRate * environmentalVirus / population);

		// Total new exposures
		const newExposures = Math.min(susceptible, directTransmissions + environmentalTransmissions);

		// Move cats from exposed to incubating
		const newlyIncubating = binomialSample(exposed, 1 / getRandomIncubationPeriod());

		// Move cats from incubating to infected
		const newlyInfected = binomialSample(incubating, 1 / getRandomIncubationPeriod());

		// Calculate deaths based on age, vaccination, and treatment status
		const kittenDeaths = binomialSample(infected * kittenPercentage, 0.9); // 90% mortality for kittens
		const unvaccinatedDeaths = binomialSample(infected * (1 - kittenPercentage) * (1 - vaccinatedPercentage), treatmentPercentage ? 0.5 : 0.85);
		const vaccinatedDeaths = binomialSample(infected * (1 - kittenPercentage) * vaccinatedPercentage, treatmentPercentage ? 0.1 : 0.15);
		const newDeaths = kittenDeaths + unvaccinatedDeaths + vaccinatedDeaths;

		// Recoveries
		const newRecoveries = binomialSample(infected, recoveryRate);

		// Reinfections
		const reinfections = binomialSample(recovered, reinfectionRate);

		// Update population groups
		susceptible = susceptible - newExposures;
		exposed = exposed + newExposures - newlyIncubating;
		incubating = incubating + newlyIncubating - newlyInfected;
		infected = infected + newlyInfected + reinfections - newRecoveries - newDeaths;
		recovered = recovered + newRecoveries - reinfections;
		deaths += newDeaths;

		// Update environmental virus
		const actualSheddingRate = sheddingRate * (1 + (Math.random() - 0.5) * 0.2); // +/- 10% variation
		environmentalVirus = environmentalVirus * (1 - virusDecayRate * (1 + (Math.random() - 0.5) * 0.1)) + infected * actualSheddingRate;

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

function binomialSample(n, p) {
    if (n < 0 || p < 0 || p > 1) {
        return 0; // Return 0 for invalid inputs
    }
    if (n > 1000000) {
        // For very large n, use normal approximation
        const mean = n * p;
        const stdDev = Math.sqrt(n * p * (1 - p));
        return Math.max(0, Math.round(normalRandom(mean, stdDev)));
    }
    return Math.round(Array.from({length: n}, () => Math.random() < p ? 1 : 0).reduce((sum, val) => sum + val, 0));
}

function getRandomIncubationPeriod() {
    return Math.max(1, Math.round(normalRandom(3, 1))); // Mean of 3 days, std dev of 1
}

function normalRandom(mean, stdDev) {
    const u = 1 - Math.random();
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdDev + mean;
}

function runMonteCarlo(numSimulations, ...params) {
    const allResults = [];
    for (let i = 0; i < numSimulations; i++) {
        allResults.push(simulatePanleukapaniaSpread(...params));
    }
    return aggregateResults(allResults);
}

function aggregateResults(allResults) {
    const aggregated = [];
    const numDays = Math.max(...allResults.map(result => result.length));

    for (let day = 0; day < numDays; day++) {
        const dayStats = allResults.map(result => result[day] || {
            susceptible: 0, exposed: 0, incubating: 0, infected: 0, recovered: 0, deaths: 0, environmentalVirus: 0
        });

        aggregated.push({
            day,
            susceptible: calculateStats(dayStats.map(s => s.susceptible)),
            exposed: calculateStats(dayStats.map(s => s.exposed)),
            incubating: calculateStats(dayStats.map(s => s.incubating)),
            infected: calculateStats(dayStats.map(s => s.infected)),
            recovered: calculateStats(dayStats.map(s => s.recovered)),
            deaths: calculateStats(dayStats.map(s => s.deaths)),
            environmentalVirus: calculateStats(dayStats.map(s => s.environmentalVirus))
        });
    }

    return aggregated;
}

function calculateStats(values) {
    const sorted = values.sort((a, b) => a - b);
    return {
        min: sorted[0],
        max: sorted[sorted.length - 1],
        median: sorted[Math.floor(sorted.length / 2)],
        mean: values.reduce((sum, val) => sum + val, 0) / values.length
    };
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

	const tbody = document.getElementById('results-body');
	results.forEach(day => {
		const row = document.createElement('tr');
		row.innerHTML = `
			<td>${day.day}</td>
			<td>${formatStat(day.susceptible)}</td>
			<td>${formatStat(day.exposed)}</td>
			<td>${formatStat(day.incubating)}</td>
			<td>${formatStat(day.infected)}</td>
			<td>${formatStat(day.recovered)}</td>
			<td>${formatStat(day.deaths)}</td>
			<td>${formatStat(day.environmentalVirus)}</td>
		`;
		tbody.appendChild(row);
	});
}

function formatStat(stat) {
    return (`
        <div class="stat-container">
            <div class="stat-value">
                <span>Mean:</span>
                ${stat.mean.toFixed(2)}
            </div>
            <div class="stat-value">
                <span>Median:</span>
                ${stat.median.toFixed(2)}
            </div>
            <div class="stat-value">
                <span>Min:</span>
                ${stat.min.toFixed(2)}
            </div>
            <div class="stat-value">
                <span>Max:</span>
                ${stat.max.toFixed(2)}
            </div>
        </div>
    `);
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
	const numSimulations = parseInt(formData.get('numSimulations') || 100);

	const results = runMonteCarlo(
		numSimulations,
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
main();


function main() {
    const mqtt = require('mqtt');

    // -----------------------------------------------------------
    // Connect to the message broker
    const client = mqtt.connect(
        {
            host: 'mosquitto',
            port: 1883
        }
    );
    // -----------------------------------------------------------


    // -----------------------------------------------------------
    // Read csv
    let collectedData = (require("fs").readFileSync("./data2.csv", "utf8")).split("\r");
    // Remove the column name (Temperature) from the array
    collectedData.shift();
    // -----------------------------------------------------------


    // Once connected ...
    client.on('connect', () => {

        // Sensor connected!
        console.log('Sensor '+ process.env.HOSTNAME + ' is now connected to the MQTT broker');

        publishCollectedData(collectedData, 'temperature', client);

    });

}

/**
 * Every 10 seconds publish a message to the temperature topic!
 * @param collectedData
 * @param topic
 * @param client
 * @return void
 */
function publishCollectedData(collectedData, topic, client){

    let i = 0; // Counter to iterate the collected data

    setInterval(() => {

        let temperatureId = i++ % collectedData.length;

        const message = JSON.stringify({
            "sensorId": process.env.HOSTNAME,
            "temperature": collectedData[temperatureId],
            'temperatureId': temperatureId,
            'collectedAt': new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
        });

        client.publish(topic, message, { qos: 0 }, (error) => {
            if (error) {
                console.error(error);
            }
        });

    }, 10 * 1000);
}

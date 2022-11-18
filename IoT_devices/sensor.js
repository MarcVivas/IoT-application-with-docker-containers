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
    let collected_data = (require("fs").readFileSync("./data2.csv", "utf8")).split("\r");
    // Remove the column name (Temperature) from the array
    collected_data.shift();
    // -----------------------------------------------------------



    let topic = 'temperature';

    // Once connected ...
    client.on('connect', () => {

        // Sensor connected
        console.log('Sensor '+ process.env.HOSTNAME + ' is now connected to the MQTT broker');

        // -----------------------------------------------------------
        // Every 10 seconds publish a message to the temperature topic!

        let i = 0; // Counter to iterate the collected data

        setInterval(() => {

            let temperatureId = i++ % collected_data.length;

            const message = JSON.stringify({
                "sensorId": process.env.HOSTNAME,
                "temperature": collected_data[temperatureId],
                'temperatureId': temperatureId,
                'collectedAt': new Date()
            });

            client.publish(topic, message, { qos: 0 }, (error) => {
                if (error) {
                    console.error(error);
                }
            });

        }, 10 * 1000);
        // -----------------------------------------------------------

    });

}

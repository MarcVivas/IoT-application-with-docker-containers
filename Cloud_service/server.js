const mqtt = require('mqtt')
const mongoose = require('mongoose');


const Sensor = mongoose.model('Sensor', new mongoose.Schema(
        {
            _id: String,
            temperatures: [
                {
                    _id: Number,
                    temperature: Number,
                    collected_at: Date
                }
            ],
        }
));


main();

function main(){

    // Connect to the database
    mongoose.connect('mongodb://admin:1234@mongo:27017/server?authSource=admin');

    // Connect to the mqtt broker
    mqtt_client = mqtt.connect(
        {
            host: 'mosquitto',
            port: 1883
        }
    );

    // Once connected...
    mqtt_client.on('connect', function (){
        // Connected!
        console.log("The server is now connected to the MQTT broker!");

        // Subscribe to the temperature topic
        mqtt_client.subscribe('temperature', function (err) {
            if(err){
                console.error(err);
            }
            else{
                console.log("The server is now subscribed to the temperature topic!");
            }
        });

        // Listen to the broker
        mqtt_client.on('message', function (topic, message) {
            // Message received

            // Get json
            const data = JSON.parse(message.toString());

            console.log("Server: Message received from sensor " + data.sensorId);

            Sensor.findOneAndUpdate(
                {_id: data.sensorId},
                {
                    $push: {
                        temperatures: {
                            _id: data.temperatureId,
                            temperature: data.temperature,
                            collected_at: data.collectedAt
                        }
                    }
                },
                {upsert: true, new: true, runValidators: true}, // options
                function (err, doc) { // callback
                    if (err) {
                        console.error("Couldn't update or create the sensor :/");
                        console.error(err);
                    } else {
                        // Handle document
                        // Nothing to handle
                    }
                }
            );
        });

    });
}



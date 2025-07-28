import amqplib from "amqplib";

// RabbitMQ connection function
export async function connectRabbitMQ() {
  try {
    const connection = await amqplib.connect(process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672");
    console.log("Connected to RabbitMQ");

    // Create a channel
    const channel = await connection.createChannel();

    // Return both the connection and channel for use in the application
    return { connection, channel };
  } catch (error) {
    console.error("Error connecting to RabbitMQ:", error);
    throw error;
  }
}

// Helper function to publish messages
export async function publishMessage(channel, exchange, routingKey, message) {
  try {
    await channel.assertExchange(exchange, "topic", { durable: true });
    channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)), { persistent: true });
    console.log(`Message published to ${exchange}:${routingKey}`);
  } catch (error) {
    console.error("Error publishing message:", error);
    throw error;
  }
}

// Helper function to consume messages
export async function consumeMessages(channel, exchange, queue, routingKey, callback) {
  try {
    await channel.assertExchange(exchange, "topic", { durable: true });
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, exchange, routingKey);

    console.log(`Consuming messages from ${queue}`);

    channel.consume(queue, (message) => {
      if (message) {
        const content = JSON.parse(message.content.toString());
        callback(content, message);
        channel.ack(message);
      }
    });
  } catch (error) {
    console.error("Error consuming messages:", error);
    throw error;
  }
}

export default { connectRabbitMQ, publishMessage, consumeMessages };

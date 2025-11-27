
namespace OrderFlowClase.Shared.Events
{

    public sealed record UserCreatedEvent(string userId, string email) : IRabbitEvent
    {
        public Guid EventId => Guid.NewGuid();

        public DateTime CreatedAt => DateTime.UtcNow;
    }
}

using MassTransit;

namespace OrderFlowClase.Shared.Events
{

    [ExcludeFromTopology]
    public interface IRabbitEvent
    {
        public Guid EventId { get;  }
        public DateTime CreatedAt { get; }
    }
}

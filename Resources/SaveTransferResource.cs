using System;

namespace Transfers.Resources
{
	public class SaveTransferResource
	{
		public int Id { get; set; }

		public DateTime dateIn { get; set; }

		public int Adults { get; set; }
		public int Kids { get; set; }
		public int Free { get; set; }

		public string Remarks { get; set; }
		public string User { get; set; }

		public int CustomerId { get; set; }
		public int TransferTypeId { get; set; }
		public int PickupPointId { get; set; }
		public int DestinationId { get; set; }
	}
}
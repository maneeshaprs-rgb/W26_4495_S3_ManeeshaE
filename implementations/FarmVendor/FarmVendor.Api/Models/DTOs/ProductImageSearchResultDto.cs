namespace FarmVendor.Api.Models.DTOs
{
    public class ProductImageSearchResultDto
    {
        public string ImageUrl { get; set; } = "";
        public string ThumbnailUrl { get; set; } = "";
        public string Alt { get; set; } = "";
        public string Source { get; set; } = "Unsplash";
        public string PhotographerName { get; set; } = "";
        public string PhotographerProfile { get; set; } = "";
        public string DownloadLocation { get; set; } = "";
    }
}
import Autoplay from "embla-carousel-autoplay"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

interface MyCarouselProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
}

export function MyCarousel<T>({ items, renderItem }: MyCarouselProps<T>) {
  return (
    <Carousel
      plugins={[Autoplay({ delay: 5000 })]}
      opts={{
        align: "start",
        loop: true,
        skipSnaps: true,
      }}
      className="w-full"
    >
      <CarouselContent>
        {items.map((item, index) => (
          <CarouselItem key={index} className="basis-full">
            {renderItem(item, index)}
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className="left-4" />
      <CarouselNext className="right-4" />
    </Carousel>
  )
}

# Image

Image is used to insert and display an image within a component.

## Example

```python
from deephaven import ui

img = ui.image(src="https://i.imgur.com/Z7AzH2c.png", alt="Sky and roof")
```

## UI Recommendations

Recommendations for creating clear and effective images:

1. Provide descriptive alt text for all images to ensure accessibility for users with visual impairments. Note: If the image is considered decorative and should not be announced by screen readers, then set alt="" to suppress the warning.
2. Alt text should convey the purpose and content of the image. For example, "Snow-capped mountains under a clear blue sky" or "Diagram illustrating the water cycle, showing evaporation, condensation, precipitation, and collection"
3. To internationalize an Image, a localized string should be passed into the alt prop.

## Variants

Images can fit to its container in different styles. The default is 'fill' which takes up the whole dimension of the container

```python
def image_variants():
    return ui.flex(
        ui.view(
            ui.image(src="https://i.imgur.com/Z7AzH2c.png", alt="Sky and roof"),
            background_color="celery-600",
            padding="10px",
        ),
        ui.view(
            ui.image(
                src="https://i.imgur.com/Z7AzH2c.png",
                alt="Sky and roof",
                object_fit="contain",
            ),
            background_color="blue-600",
            padding="10px",
            padding_x="25px",
        ),
        ui.view(
            ui.image(
                src="https://i.imgur.com/Z7AzH2c.png",
                alt="Sky and roof",
                object_fit="cover",
            ),
            background_color="blue-600",
            width="75%",
        ),
        ui.view(
            ui.image(
                src="https://i.imgur.com/Z7AzH2c.png",
                alt="Sky and roof",
                object_fit="none",
            )
        ),
        ui.view(
            ui.image(
                src="https://i.imgur.com/Z7AzH2c.png",
                alt="Sky and roof",
                object_fit="scale-down",
            )
        ),
        direction="column",
        width="300px",
    )


image_variants_example = image_variants()
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.image
```


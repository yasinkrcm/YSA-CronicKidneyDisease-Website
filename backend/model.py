import torch
import torch.nn as nn


class KidneyDiseaseClassifier(nn.Module):
    """Notebook'taki DynamicMLPModel ile birebir aynı mimari.
    hidden_layers=(64, 32), activation='relu', num_classes=2
    """
    def __init__(self, input_size=24, hidden_layers=(64, 32), num_classes=2):
        super().__init__()
        self.layers = nn.ModuleList()
        self.act = nn.ReLU()

        in_features = input_size
        for out_features in hidden_layers:
            self.layers.append(nn.Linear(in_features, out_features))
            in_features = out_features
        self.output_layer = nn.Linear(in_features, num_classes)

    def forward(self, x):
        for layer in self.layers:
            x = self.act(layer(x))
        return self.output_layer(x)
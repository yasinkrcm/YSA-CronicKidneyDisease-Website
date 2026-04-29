import torch
import torch.nn as nn


class KidneyDiseaseClassifier(nn.Module):
    def __init__(self, input_size=24):
        super().__init__()
        self.layers = nn.Sequential(
            nn.Linear(input_size, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 32),
        )
        self.output_layer = nn.Linear(32, 3)

    def forward(self, x):
        x = self.layers(x)
        return self.output_layer(x)
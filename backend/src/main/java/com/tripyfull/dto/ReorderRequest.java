package com.tripyfull.dto;

import java.util.List;
import java.util.UUID;

public record ReorderRequest(List<UUID> orderedIds) {}

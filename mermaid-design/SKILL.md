---
name: mermaid-design
description: Generate and work with Mermaid diagrams for documenting system architecture, user flows, processes, and technical concepts across all types of projects. Use this skill when creating visual representations of code structures, workflows, API interactions, system designs, or business processes in any technology stack or domain.
---

# Mermaid Design Skill

This skill provides capabilities for generating, editing, and working with Mermaid diagrams to visualize systems, processes, and technical concepts across all types of projects regardless of technology stack or domain.

## When to Use This Skill

Use this skill when you need to:
- Document system architecture with visual diagrams
- Create user flow charts for any application type
- Visualize API interactions and data flows
- Generate process diagrams for business logic
- Create documentation diagrams for team communication
- Represent database schemas or data models visually
- Model software architecture patterns
- Illustrate deployment configurations
- Diagram microservice interactions
- Map out CI/CD pipelines
- Document security workflows

## Diagram Types Supported

### Flowcharts
```mermaid
graph TD
    A[Start] --> B[Process]
    B --> C{Decision}
    C -->|Yes| D[Action 1]
    C -->|No| E[Action 2]
```

### Sequence Diagrams
```mermaid
sequenceDiagram
    participant A as Actor
    participant S as System
    A->>S: Request
    S-->>A: Response
```

### Class Diagrams
```mermaid
classDiagram
    class Customer {
        +String name
        +String email
        +placeOrder()
    }
```

### State Diagrams
```mermaid
stateDiagram-v2
    [*] --> Still
    Still --> Moving
    Moving --> Still
```

### Gantt Charts
```mermaid
gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Development
    Analysis :done, des1, 2025-01-01, 2025-01-05
    Design :active, des2, 2025-01-06, 3d
    Implementation : 2025-01-09, 5d
```

## Universal Templates for Various Project Types

### 1. Software Architecture
```mermaid
graph TB
    subgraph "Frontend"
        A[Client Application]
    end

    subgraph "Backend Services"
        B[API Gateway]
        C[Service 1]
        D[Service 2]
        E[Service N]
    end

    subgraph "Data Layer"
        F[Database]
        G[Cache]
        H[Message Queue]
    end

    subgraph "Infrastructure"
        I[Load Balancer]
        J[Monitoring]
    end

    A <--> B
    B <--> C
    B <--> D
    B <--> E
    C <--> F
    D <--> G
    E <--> H
    I --> B
    J -.-> B
```

### 2. Microservices Architecture
```mermaid
graph LR
    subgraph "Client"
        A[Frontend]
    end

    subgraph "API Layer"
        B[API Gateway]
    end

    subgraph "Services"
        C[User Service]
        D[Order Service]
        E[Payment Service]
        F[Notification Service]
    end

    subgraph "Shared Infrastructure"
        G[Database]
        H[Message Bus]
        I[Caching Layer]
    end

    A --> B
    B --> C
    B --> D
    B --> E
    B --> F
    C --> G
    D --> G
    E --> H
    F --> H
    C --> I
    D --> I
```

### 3. Deployment Architecture
```mermaid
graph TB
    subgraph "Cloud Provider"
        subgraph "Region 1"
            subgraph "Availability Zone A"
                A[Load Balancer]
                B[VM Instance 1]
                C[VM Instance 2]
            end
            subgraph "Availability Zone B"
                D[VM Instance 3]
                E[VM Instance 4]
            end
            F[Database Cluster]
        end
    end

    A --> B
    A --> C
    A --> D
    A --> E
    B --> F
    C --> F
    D --> F
    E --> F
```

### 4. Development Process Flow
```mermaid
graph TD
    A[Requirement Analysis] --> B[Design Phase]
    B --> C[Implementation]
    C --> D[Code Review]
    D --> E[Testing]
    E --> F{Tests Pass?}
    F -->|Yes| G[Deployment]
    F -->|No| C
    G --> H[Maintenance]
    H --> I[Feedback]
    I --> A
```

### 5. CI/CD Pipeline
```mermaid
graph LR
    A[Commit/Push] --> B[Trigger Build]
    B --> C[Unit Tests]
    C --> D[Integration Tests]
    D --> E[Build Artifact]
    E --> F[Deploy to Staging]
    F --> G[System Tests]
    G --> H[Deploy to Production]
    H --> I[Monitoring]
```

### 6. Database Relationships
```mermaid
erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--o{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : "included in"
    CATEGORY ||--o{ PRODUCT : categorizes
    USER {
        int id PK
        string email
        string name
    }
    ORDER {
        int id PK
        datetime created_at
        int user_id FK
    }
    PRODUCT {
        int id PK
        string name
        decimal price
    }
    ORDER_ITEM {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
    }
```

## Pre-configured Templates by Category

### Web Applications
```mermaid
graph TB
    subgraph "Client Side"
        A[Browser] --> B[SPA Framework]
        B --> C[State Management]
    end

    subgraph "Server Side"
        D[API Server] --> E[Authentication]
        E --> F[Business Logic]
        F --> G[Data Access]
    end

    subgraph "Data Layer"
        H[Database]
        I[File Storage]
    end

    C <--> D
    G --> H
    G --> I
```

### Mobile Applications
```mermaid
graph LR
    A[Mobile App] --> B[Native API]
    A --> C[Hybrid WebView]
    B --> D[Backend API]
    C --> D
    D --> E[Database]
    D --> F[External Services]
```

### Cloud Architecture
```mermaid
graph TB
    subgraph "Public Cloud"
        A[Load Balancer]
        B[Auto Scaling Group]
        C[Container Orchestration]
        D[Serverless Functions]
    end

    subgraph "Storage Services"
        E[Object Storage]
        F[Database Service]
        G[CDN]
    end

    subgraph "Security"
        H[Identity Provider]
        I[Key Management]
    end

    A --> B
    A --> C
    A --> D
    B --> E
    C --> F
    A --> G
    H --> B
    I --> F
```

## Rendering Mermaid Diagrams

Mermaid diagrams can be rendered using various tools:

1. **Mermaid Live Editor**: Paste the diagram code into https://mermaid.live
2. **GitHub**: Mermaid diagrams render directly in markdown files
3. **Documentation Tools**: Many tools like Notion, Obsidian, and GitLab support Mermaid
4. **IDE Extensions**: VS Code extensions like "Mermaid Preview" can render diagrams
5. **Command Line Tools**: Tools like `mmdc` (Mermaid CLI) can generate images from diagram code

## Generating Diagrams Programmatically

The skill includes tools for:
- Creating parameterized templates for consistent diagrams
- Generating diagrams from data configuration files
- Maintaining diagram consistency across documentation

## Customization for Specific Projects

While this skill provides universal templates, you can easily adapt diagrams for specific technologies:

1. **Node.js Applications**: Replace generic services with Express, NestJS, etc.
2. **Python Applications**: Adapt for Django, Flask, FastAPI frameworks
3. **Java Applications**: Customize for Spring Boot, Jakarta EE
4. **Cloud Platforms**: Modify for AWS, Azure, GCP specific services
5. **DevOps**: Adapt for Docker, Kubernetes, Terraform specifics

## Integration with Documentation Workflows

Include generated diagrams in:
- System architecture documents
- Developer onboarding materials
- API documentation
- Troubleshooting guides
- Technical proposals
- Training materials
- Stakeholder presentations
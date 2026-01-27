# Industry Standard Diagram Patterns

## Software Architecture Patterns

### Layered Architecture
```mermaid
graph TB
    subgraph "Presentation Layer"
        A[User Interface]
    end
    subgraph "Application Layer"
        B[Controllers]
        C[Services]
    end
    subgraph "Integration Layer"
        D[Data Access Objects]
    end
    subgraph "Data Layer"
        E[Database]
    end

    A --> B
    B --> C
    C --> D
    D --> E
```

### Hexagonal Architecture (Ports and Adapters)
```mermaid
graph TB
    subgraph "Domain Core"
        A[Entities]
        B[Use Cases]
        C[Interfaces]
    end

    subgraph "Adapters"
        D[API Controllers]
        E[Database Adapters]
        F[External Service Adapters]
    end

    D --> A
    E --> A
    F --> A
    A --> D
    A --> E
    A --> F
```

### Clean Architecture
```mermaid
graph RL
    subgraph "Frameworks & Drivers"
        A[UI, DB, External APIs]
    end
    subgraph "Interface Adapters"
        B[Controllers, Gateways, Presenters]
    end
    subgraph "Use Cases"
        C[Application Business Rules]
    end
    subgraph "Entities"
        D[Enterprise Business Rules]
    end

    A --> B
    B --> C
    C --> D
    D --> C
    C --> B
    B --> A
```

## System Design Patterns

### Event-Driven Architecture
```mermaid
graph LR
    subgraph "Event Producers"
        A[User Service]
        B[Order Service]
        C[Inventory Service]
    end

    subgraph "Message Broker"
        D[Event Stream/Kafka]
    end

    subgraph "Event Consumers"
        E[Notification Service]
        F[Analytics Service]
        G[Audit Service]
    end

    A --> D
    B --> D
    C --> D
    D --> E
    D --> F
    D --> G
```

### Microservices Architecture
```mermaid
graph TB
    subgraph "API Gateway Layer"
        A[API Gateway]
    end

    subgraph "Core Services"
        B[Identity Service]
        C[Product Catalog]
        D[Order Management]
        E[Payment Service]
        F[Inventory Service]
    end

    subgraph "Supporting Services"
        G[Notification Service]
        H[Analytics Service]
        I[Logging & Monitoring]
    end

    subgraph "Data Stores"
        J[SQL Database]
        K[Document DB]
        L[Cache Layer]
        M[Message Queue]
    end

    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
    B --> J
    C --> K
    D --> J
    E --> M
    F --> L
    G --> M
    I --> J
    I --> K
```

## DevOps and Infrastructure

### CI/CD Pipeline
```mermaid
graph LR
    subgraph "Source Control"
        A[Git Repository]
    end

    subgraph "CI Pipeline"
        B[Build]
        C[Test]
        D[Security Scan]
        E[Artifact Storage]
    end

    subgraph "CD Pipeline"
        F[Deploy to Dev]
        G[Test in Dev]
        H[Deploy to Stage]
        I[Test in Stage]
        J[Deploy to Prod]
    end

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
```

### Infrastructure Architecture
```mermaid
graph TB
    subgraph "Cloud Provider"
        subgraph "Network Layer"
            A[Load Balancer]
            B[DNS Service]
            C[Firewall/VPC]
        end

        subgraph "Compute Layer"
            D[Container Orchestrator]
            E[Virtal Machines]
            F[Serverless Functions]
        end

        subgraph "Storage Layer"
            G[Block Storage]
            H[Object Storage]
            I[Archive Storage]
        end

        subgraph "Database Layer"
            J[SQL Database]
            K[NoSQL Database]
            L[Caching Layer]
        end

        subgraph "Security Layer"
            M[Identity Provider]
            N[Secrets Manager]
            O[Certificate Manager]
        end
    end

    A --> D
    A --> E
    A --> F
    D --> G
    D --> H
    D --> J
    D --> K
    M --> D
    M --> E
    M --> J
    N --> D
    N --> E
    N --> J
```

## Database Design Patterns

### Relational Schema
```mermaid
erDiagram
    USER ||--o{ PROFILE : has
    USER ||--o{ ADDRESS : owns
    USER ||--o{ ORDER : places
    ORDER ||--o{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : "included in"
    CATEGORY ||--o{ PRODUCT : categorizes
    PAYMENT_METHOD ||--o{ PAYMENT : uses
    ORDER ||--o{ PAYMENT : "has payment"

    USER {
        int id PK
        string email UK
        datetime created_at
    }
    PROFILE {
        int user_id FK
        string first_name
        string last_name
    }
    ORDER {
        int id PK
        int user_id FK
        datetime created_at
        decimal total_amount
    }
    PRODUCT {
        int id PK
        string name
        decimal price
        int stock_quantity
    }
    ORDER_ITEM {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
        decimal unit_price
    }
```

### Document Schema
```mermaid
graph TD
    A["User Collection<br/>{<br/>  _id: ObjectId,<br/>  email: string,<br/>  profile: {<br/>    name: string,<br/>    age: number<br/>  },<br/>  orders: [<br/>    {<br/>      order_id: ObjectId,<br/>      items: [...]<br/>    }<br/>  ]<br/>}"]

    B["Product Collection<br/>{<br/>  _id: ObjectId,<br/>  name: string,<br/>  variants: [<br/>    {<br/>      sku: string,<br/>      price: number<br/>    }<br/>  ]<br/>}"]

    C["Order Collection<br/>{<br/>  _id: ObjectId,<br/>  user_id: ObjectId,<br/>  items: [<br/>    {<br/>      product_id: ObjectId,<br/>      quantity: number,<br/>      price: number<br/>    }<br/>  ],<br/>  status: string<br/>}"]

    A -.-> C
    B -.-> C
```

## Security Architecture

### Zero Trust Architecture
```mermaid
graph TB
    subgraph "Perimeterless Security"
        subgraph "Identity Verification"
            A[Identity Provider]
            B[Device Authentication]
            C[Network Access Control]
        end

        subgraph "Continuous Verification"
            D[Behavioral Analytics]
            E[Threat Detection]
            F[Access Control Policies]
        end

        subgraph "Resource Protection"
            G[Micro-segmentation]
            H[Encrypted Communication]
            I[Data Loss Prevention]
        end
    end

    A --> D
    B --> E
    C --> F
    D --> G
    E --> H
    F --> I
```

## API Design Patterns

### RESTful API Architecture
```mermaid
graph LR
    subgraph "Client"
        A[Frontend App]
        B[Mobile App]
        C[Third-party Service]
    end

    subgraph "API Gateway"
        D[Rate Limiting]
        E[Authentication]
        F[Request Routing]
    end

    subgraph "API Services"
        G[User Service]
        H[Product Service]
        I[Order Service]
    end

    subgraph "Data Layer"
        J[Database]
        K[Cache]
        L[Message Queue]
    end

    A --> D
    B --> D
    C --> D
    D --> G
    D --> H
    D --> I
    G --> J
    H --> K
    I --> L
```

### GraphQL Architecture
```mermaid
graph TB
    subgraph "Client Layer"
        A[Web Client]
        B[Mobile Client]
        C[GraphQL Playground]
    end

    subgraph "GraphQL Layer"
        D[Schema Definition]
        E[Resolvers]
        F[Data Loaders]
    end

    subgraph "Data Sources"
        G[REST API]
        H[Database]
        I[Legacy System]
        J[External Service]
    end

    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    E --> G
    E --> H
    E --> I
    E --> J
```

## Business Process Patterns

### Order Processing Flow
```mermaid
graph TD
    A[Order Received] --> B{Validate Order}
    B -->|Invalid| C[Reject Order]
    B -->|Valid| D[Process Payment]
    D --> E{Payment Approved?}
    E -->|No| F[Payment Failed]
    E -->|Yes| G[Check Inventory]
    G --> H{Sufficient Stock?}
    H -->|No| I[Out of Stock]
    H -->|Yes| J[Fulfill Order]
    J --> K[Ship Product]
    K --> L[Notify Customer]
    L --> M[Update Records]

    style A fill:#e1f5fe
    style M fill:#e8f5e8
    style F fill:#ffebee
    style C fill:#ffebee
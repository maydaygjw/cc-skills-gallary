#!/usr/bin/env node

/**
 * Mermaid Design Generator
 * Flexible tool for generating various types of diagrams for any project type
 */

const fs = require('fs');
const path = require('path');

// Define common diagram templates organized by category
const diagramCategories = {
  architecture: {
    title: "System Architecture Diagrams",
    templates: {
      layered: {
        description: "Layered architecture with presentation, application, and data layers",
        template: `graph TB
    subgraph "Presentation Layer"
        A[User Interface]
    end
    subgraph "Application Layer"
        B[Controllers]
        C[Services]
    end
    subgraph "Data Layer"
        D[Data Access]
        E[Database]
    end

    A --> B
    B --> C
    C --> D
    D --> E`
      },
      microservices: {
        description: "Microservices architecture with API gateway and services",
        template: `graph TB
    subgraph "Client"
        A[Frontend Apps]
    end

    subgraph "API Layer"
        B[API Gateway]
    end

    subgraph "Services"
        C[User Service]
        D[Order Service]
        E[Payment Service]
    end

    subgraph "Data Layer"
        F[Database]
        G[Message Queue]
        H[Cache]
    end

    A <--> B
    B <--> C
    B <--> D
    B <--> E
    C <--> F
    D <--> G
    E <--> H`
      },
      eventDriven: {
        description: "Event-driven architecture with message broker",
        template: `graph LR
    subgraph "Producers"
        A[Service A]
        B[Service B]
        C[Service C]
    end

    subgraph "Message Broker"
        D[Event Stream]
    end

    subgraph "Consumers"
        E[Service D]
        F[Service E]
        G[Service F]
    end

    A --> D
    B --> D
    C --> D
    D --> E
    D --> F
    D --> G`
      }
    }
  },

  process: {
    title: "Process Flow Diagrams",
    templates: {
      ciCd: {
        description: "CI/CD pipeline flow",
        template: `graph LR
    A[Code Commit] --> B[Trigger Build]
    B --> C[Run Tests]
    C --> D[Security Scan]
    D --> E[Build Artifact]
    E --> F{Tests Pass?}
    F -->|Yes| G[Deploy to Staging]
    F -->|No| H[Report Failure]
    G --> I[Run Integration Tests]
    I --> J{Acceptance?}
    J -->|Yes| K[Deploy to Production]
    J -->|No| L[Rollback]`
      },
      orderProcessing: {
        description: "Order processing business flow",
        template: `graph TD
    A[Order Received] --> B{Validate Order}
    B -->|Valid| C[Process Payment]
    B -->|Invalid| D[Reject Order]
    C --> E{Payment Approved?}
    E -->|Yes| F[Check Inventory]
    E -->|No| G[Payment Failed]
    F --> H{Stock Available?}
    H -->|Yes| I[Fulfill Order]
    H -->|No| J[Out of Stock]
    I --> K[Ship Product]
    K --> L[Notify Customer]`
      },
      development: {
        description: "Software development lifecycle",
        template: `graph TD
    A[Requirements] --> B[Analysis]
    B --> C[Design]
    C --> D[Implementation]
    D --> E[Testing]
    E --> F{Approval?}
    F -->|Yes| G[Deployment]
    F -->|No| D
    G --> H[Maintenance]
    H --> I[Feedback]
    I --> A`
      }
    }
  },

  database: {
    title: "Database Schema Diagrams",
    templates: {
      relational: {
        description: "Relational database schema",
        template: `erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--o{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : "included in"
    CATEGORY ||--o{ PRODUCT : categorizes

    USER {
        int id PK
        string email UK
        datetime created_at
    }
    ORDER {
        int id PK
        int user_id FK
        datetime order_date
        decimal total_amount
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
    }`
      },
      document: {
        description: "Document database schema structure",
        template: `graph TD
    A["User Document<br/>{<br/>  _id, email, profile {...}<br/>  orders: [...] <br/>}"]

    B["Product Document<br/>{<br/>  _id, name, variants [...] <br/>}"]

    C["Order Document<br/>{<br/>  _id, userId, items [...] <br/>}"]

    A -.-> C
    B -.-> C`
      }
    }
  },

  deployment: {
    title: "Deployment Architecture",
    templates: {
      cloud: {
        description: "Cloud infrastructure architecture",
        template: `graph TB
    subgraph "Cloud Provider"
        subgraph "Network"
            A[Load Balancer]
            B[DNS]
            C[Firewall]
        end

        subgraph "Compute"
            D[Container Orchestrator]
            E[Virtual Machines]
            F[Serverless Functions]
        end

        subgraph "Storage"
            G[Object Storage]
            H[Block Storage]
            I[Database Services]
        end

        subgraph "Security"
            J[Identity Provider]
            K[Secrets Manager]
        end
    end

    A --> D
    A --> E
    D --> G
    E --> H
    D --> I
    J --> D
    K --> I`
      },
      kubernetes: {
        description: "Kubernetes cluster architecture",
        template: `graph LR
    subgraph "Control Plane"
        A[API Server]
        B[Scheduler]
        C[Controller Manager]
        D[etcd]
    end

    subgraph "Worker Nodes"
        E[Kubelet]
        F[Container Runtime]
        G[Kube Proxy]
    end

    subgraph "Applications"
        H[Deployments]
        I[Services]
        J[Ingress]
    end

    A <--> B
    A <--> C
    A <--> D
    A <--> E
    E <--> F
    E <--> G
    H --> I
    I --> J`
      }
    }
  }
};

function listCategories() {
  console.log("Available diagram categories:");
  Object.keys(diagramCategories).forEach((category, idx) => {
    console.log(`\n${idx + 1}. ${diagramCategories[category].title} (${category})`);
    console.log("   Templates:");
    Object.keys(diagramCategories[category].templates).forEach(template => {
      console.log(`     - ${template}: ${diagramCategories[category].templates[template].description}`);
    });
  });
}

function listTemplates(category) {
  if (!diagramCategories[category]) {
    console.error(`Category "${category}" not found.`);
    listCategories();
    return;
  }

  console.log(`Available templates in "${category}" category:`);
  Object.keys(diagramCategories[category].templates).forEach((template, idx) => {
    console.log(`${idx + 1}. ${template} - ${diagramCategories[category].templates[template].description}`);
  });
}

function generateDiagram(category, templateName, outputFile) {
  if (!diagramCategories[category]) {
    console.error(`Category "${category}" not found.`);
    listCategories();
    return;
  }

  if (!diagramCategories[category].templates[templateName]) {
    console.error(`Template "${templateName}" not found in category "${category}".`);
    listTemplates(category);
    return;
  }

  const diagram = diagramCategories[category].templates[templateName].template;

  if (outputFile) {
    // Write to file
    fs.writeFileSync(outputFile, diagram);
    console.log(`Diagram saved to ${outputFile}`);
  } else {
    // Output to console
    console.log("Generated diagram:");
    console.log("==================");
    console.log(diagram);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log("Mermaid Design Generator");
  console.log("=========================");
  console.log("Usage:");
  console.log("  node generate-diagram.js list                           - List all categories and templates");
  console.log("  node generate-diagram.js list <category>               - List templates in specific category");
  console.log("  node generate-diagram.js <category> <template-name>    - Generate diagram to console");
  console.log("  node generate-diagram.js <category> <template-name> <file> - Generate diagram to file");
  console.log("");
  listCategories();
  return;
}

if (args[0] === 'list') {
  if (args[1]) {
    listTemplates(args[1]);
  } else {
    listCategories();
  }
} else {
  const category = args[0];
  const templateName = args[1];
  const outputFile = args[2]; // Optional
  generateDiagram(category, templateName, outputFile);
}
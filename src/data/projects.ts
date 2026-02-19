export interface Project {
  title: string;
  description: string;
  tags: string[];
  repo?: string;
  url?: string;
  status: 'active' | 'planned' | 'complete';
}

const projects: Project[] = [
  {
    title: 'N2 Solutions Website',
    description:
      'This site. Built with Astro, React, and Tailwind CSS. Hosted on AWS S3 + CloudFront with IaC via OpenTofu and Terragrunt.',
    tags: ['Astro', 'React', 'Tailwind', 'AWS', 'OpenTofu'],
    repo: 'https://github.com/n2solutionsio/website',
    status: 'active',
  },
  {
    title: 'Homelab Infrastructure',
    description:
      'Proxmox-based homelab running Kubernetes, Docker, and various self-hosted services. Fully managed with IaC.',
    tags: ['Proxmox', 'Kubernetes', 'Docker', 'Terraform', 'Ansible'],
    status: 'active',
  },
  {
    title: 'CI/CD Pipeline Templates',
    description:
      'Reusable GitHub Actions workflows for building, testing, and deploying cloud-native applications.',
    tags: ['GitHub Actions', 'CI/CD', 'DevOps'],
    status: 'planned',
  },
  {
    title: 'Raspberry Pi Cluster',
    description:
      'Multi-node Raspberry Pi cluster for learning distributed systems, Kubernetes, and edge computing.',
    tags: ['Raspberry Pi', 'Kubernetes', 'Edge Computing'],
    status: 'planned',
  },
];

export default projects;

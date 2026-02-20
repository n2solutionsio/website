export interface Project {
  title: string;
  description: string;
  tags: string[];
  repo?: string;
  url?: string;
  status: 'active' | 'complete';
}

const projects: Project[] = [
  {
    title: 'N2 Solutions Website',
    description:
      'This site. Built with Astro, React, and Tailwind CSS. Hosted on AWS S3 + CloudFront with CI/CD via GitHub Actions.',
    tags: ['Astro', 'React', 'Tailwind', 'AWS', 'GitHub Actions'],
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
];

export default projects;

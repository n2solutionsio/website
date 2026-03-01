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
      'Production-grade homelab — 5 VLANs, 10G backbone, 3-node k3s cluster, full GitOps with ArgoCD, and complete observability. Built with Claude Code as AI co-pilot. All open-source, all IaC.',
    tags: [
      'Proxmox',
      'k3s',
      'ArgoCD',
      'OpenTofu',
      'Terragrunt',
      'Prometheus',
      'Grafana',
    ],
    repo: 'https://github.com/n2solutionsio/homelab-gitops',
    url: '/blog/homelab-v1/',
    status: 'active',
  },
];

export default projects;
